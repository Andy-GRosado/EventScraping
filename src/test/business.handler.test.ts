import { ConsultaRucHandler } from "../handler/business.handler";

describe('Consulta RUC Handler', () => {
  let consulta_ruc_handler: ConsultaRucHandler;

  beforeEach(() => {
    consulta_ruc_handler = new ConsultaRucHandler()
  })

  test(('Single'), async () => {
    let result = await consulta_ruc_handler.singleRequest('20506343616');
    expect(result).toMatchObject({
      processed: ['20506343616'],
      error: []
    })
  }),
  test(('Many'), async () => {
    let result = await consulta_ruc_handler.bulkRequest(['20506343616', '20611456001', '20545249431']);
    expect(result).toMatchObject({
      processed: ['20506343616', '20611456001', '20545249431'],
      error: []
    })
  })
})
