export function installCadespluginMock({ certs, signature, signError = null, pluginMissing = false }) {
  const state = { certs, signature, signError, calls: [] };
  window.__cadesMock = state;

  if (pluginMissing) {
    const rejected = Promise.reject('Плагин недоступен');
    rejected.catch(() => {});
    window.cadesplugin = rejected;
    return;
  }

  const certApi = (c) => ({
    Thumbprint: c.thumbprint,
    SubjectName: `SN=${c.subject.split(' ')[0]}, G=${c.subject.split(' ').slice(1).join(' ')}, CN=${c.subject}`,
    IssuerName: `CN=${c.issuer}`,
    SerialNumber: c.thumbprint.slice(0, 8),
    ValidFromDate: '2026-01-15T00:00:00Z',
    ValidToDate: c.validTo,
    PrivateKey: { UniqueContainerName: '\\\\.\\Aktiv Rutoken ECP 00 00\\e2e-container' }
  });

  const collection = (items) => ({
    Count: items.length,
    Item: async (i) => {
      if (!items[i - 1]) throw new Error('Не удается найти объект или свойство. (0x80092004)');
      return items[i - 1];
    },
    Find: async (type, value) => collection(
      typeof value === 'string' && /^[0-9A-F]{40}$/i.test(value)
        ? items.filter((x) => x.Thumbprint.toUpperCase() === value.toUpperCase())
        : items
    )
  });

  const factories = {
    'CAdESCOM.About': () => ({ Version: '2.0.15400' }),
    'CAdESCOM.Store': () => ({
      Open: async () => {},
      Close: async () => {},
      Certificates: collection(state.certs.map(certApi))
    }),
    'CADESCOM.CPAttribute': () => ({ propset_Name: async () => {}, propset_Value: async () => {} }),
    'CAdESCOM.CPSigner': () => {
      const signer = {
        AuthenticatedAttributes2: { Add: async () => {} },
        propset_Certificate: async (cert) => { signer.certificate = cert; },
        propset_Options: async () => {}
      };
      return signer;
    },
    'CAdESCOM.CadesSignedData': () => {
      const sd = {
        propset_ContentEncoding: async (v) => { sd.encoding = v; },
        propset_Content: async (v) => { sd.content = v; },
        SignCades: async (signer, type, detached) => {
          state.calls.push({
            thumbprint: signer.certificate?.Thumbprint,
            content: sd.content,
            encoding: sd.encoding,
            type,
            detached
          });
          if (state.signError) throw new Error(state.signError);
          return state.signature;
        }
      };
      return sd;
    }
  };

  const plugin = Promise.resolve();
  plugin.CreateObjectAsync = async (name) => {
    const make = factories[name];
    if (!make) throw new Error(`Неизвестный объект ${name}`);
    return make();
  };
  window.cadesplugin = plugin;
}
