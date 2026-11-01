$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

function Send-Result([hashtable]$Result) {
  [Console]::Out.Write((ConvertTo-Json -InputObject $Result -Compress -Depth 4))
  exit 0
}

function Get-HResult($Record) {
  $e = $Record.Exception
  while ($null -ne $e) {
    if ($e -is [System.Runtime.InteropServices.ExternalException]) { return ('0x{0:X8}' -f $e.ErrorCode) }
    $e = $e.InnerException
  }
  return ('0x{0:X8}' -f $Record.Exception.HResult)
}

function Test-CertificateChain([byte[]]$Der, [string]$Revocation, [int]$TimeoutSec) {
  $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($Der)
  $chain = [System.Security.Cryptography.X509Certificates.X509Chain]::new()
  if ($Revocation -eq 'offline') {
    $chain.ChainPolicy.RevocationMode = [System.Security.Cryptography.X509Certificates.X509RevocationMode]::Offline
  } else {
    $chain.ChainPolicy.RevocationMode = [System.Security.Cryptography.X509Certificates.X509RevocationMode]::Online
  }
  $chain.ChainPolicy.RevocationFlag = [System.Security.Cryptography.X509Certificates.X509RevocationFlag]::EntireChain
  $chain.ChainPolicy.UrlRetrievalTimeout = [TimeSpan]::FromSeconds($TimeoutSec)
  $chain.ChainPolicy.VerificationFlags = [System.Security.Cryptography.X509Certificates.X509VerificationFlags]::NoFlag
  $valid = $chain.Build($cert)
  $status = @($chain.ChainStatus | ForEach-Object { $_.Status.ToString() })
  $chain.Reset()
  return @{ valid = [bool]$valid; status = $status; thumbprint = $cert.Thumbprint }
}

try {
  $req = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch {
  Send-Result @{ ok = $false; stage = 'input' }
}

$timeout = [int]$req.timeoutSec
if ($timeout -le 0) { $timeout = 10 }

if ($req.mode -eq 'about') {
  try {
    $about = New-Object -ComObject 'CAdESCOM.About'
  } catch {
    Send-Result @{ ok = $false; stage = 'com'; hresult = (Get-HResult $_) }
  }
  $info = @{ ok = $true; plugin = [string]$about.Version }
  try {
    $csp = $about.CSPVersion('', 80)
    $info.csp = '{0}.{1}.{2}' -f $csp.MajorVersion, $csp.MinorVersion, $csp.BuildVersion
  } catch {
    $info.csp = $null
  }
  Send-Result $info
}

if ($req.mode -eq 'cert') {
  try {
    $chain = Test-CertificateChain ([Convert]::FromBase64String([string]$req.certificate)) ([string]$req.revocation) $timeout
  } catch {
    Send-Result @{ ok = $false; stage = 'chain'; hresult = (Get-HResult $_) }
  }
  Send-Result @{ ok = $true; chainValid = $chain.valid; chainStatus = $chain.status; certThumbprint = $chain.thumbprint }
}

if ($req.mode -ne 'verify') {
  Send-Result @{ ok = $false; stage = 'input' }
}

try {
  $sd = New-Object -ComObject 'CAdESCOM.CadesSignedData'
} catch {
  Send-Result @{ ok = $false; stage = 'com'; hresult = (Get-HResult $_) }
}

try {
  $sd.ContentEncoding = 1
  $sd.Content = [string]$req.content
  $sd.VerifyCades([string]$req.signature, 1, $true)
} catch {
  Send-Result @{ ok = $false; stage = 'signature'; hresult = (Get-HResult $_); message = [string]$_.Exception.Message }
}

$signers = $sd.Signers
if ($signers.Count -ne 1) {
  Send-Result @{ ok = $false; stage = 'signers'; count = [int]$signers.Count }
}
$signerThumbprint = [string]$signers.Item(1).Certificate.Thumbprint

try {
  $chain = Test-CertificateChain ([Convert]::FromBase64String([string]$req.certificate)) ([string]$req.revocation) $timeout
} catch {
  Send-Result @{ ok = $false; stage = 'chain'; hresult = (Get-HResult $_) }
}

Send-Result @{
  ok = $true
  signerThumbprint = $signerThumbprint
  chainValid = $chain.valid
  chainStatus = $chain.status
  certThumbprint = $chain.thumbprint
}
