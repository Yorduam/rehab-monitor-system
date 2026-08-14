param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Target
)

$ErrorActionPreference = 'Stop'

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
  $wb = $excel.Workbooks.Open($Source, $false, $true)
  $ws = $wb.Worksheets.Item(1)

  $area = $ws.PageSetup.PrintArea
  if ([string]::IsNullOrWhiteSpace($area)) { $range = $ws.UsedRange } else { $range = $ws.Range($area) }
  $range.Copy() | Out-Null

  $doc = $word.Documents.Add()

  $ps = $doc.PageSetup
  $ps.PaperSize = 7
  $ps.Orientation = 0
  $ps.TopMargin = $ws.PageSetup.TopMargin
  $ps.BottomMargin = $ws.PageSetup.BottomMargin
  $ps.LeftMargin = $ws.PageSetup.LeftMargin
  $ps.RightMargin = $ws.PageSetup.RightMargin

  $word.Selection.PasteExcelTable($false, $false, $false)

  $tables = $doc.Tables.Count
  if ($tables -gt 0) {
    $t = $doc.Tables.Item(1)
    $t.PreferredWidthType = 2
    $t.PreferredWidth = 100
    $t.Rows.AllowBreakAcrossPages = $true
  }

  if (Test-Path $Target) { Remove-Item $Target -Force }
  $doc.SaveAs2($Target, 16)
  $doc.Close($false)
  $wb.Close($false)

  Write-Output "$([System.IO.Path]::GetFileNameWithoutExtension($Target)) | tables $tables"
}
finally {
  $word.Quit()
  $excel.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
}
