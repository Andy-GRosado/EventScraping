
import { ConsultaRucRequester } from "../handler/request.handler"


describe('Consulta Ruc Requester', () => {
  let consulta_ruc_requester: ConsultaRucRequester;

  beforeEach(() => {
    consulta_ruc_requester = new ConsultaRucRequester();
  });

  test('Normal - 20506343616', async () => {
    const result = await consulta_ruc_requester.fetch_data("10430915989");
    expect(result)
    .toEqual({
      ruc: "10430915989",
      razon_social: "PACUS PEÑA KATHERINE PAOLA",
      tipo_contribuyente: "PERSONA NATURAL CON NEGOCIO",
      nombre_comercial: "PIQUIÑUELO",
      fecha_inscripcion: "27/07/2012",
      fecha_inicio_actividades: "27/07/2012",
      estado_contribuyente: "ACTIVO",
      condicion_contribuyente: "HABIDO",
      domicilio_fiscal: {
        direccion: "-",
        provincia: "",
        distrito: ""
      },
      sistema_emision_comprobante: "MANUAL/COMPUTARIZADO",
      actividad_exterior: "SIN ACTIVIDAD",
      actividad_economica_principal: {
        cod: "4761",
        description: "VENTA AL POR MENOR DE LIBROS, PERIÓDICOS Y ARTÍCULOS DE PAPELERÍA EN COMERCIOS ESPECIALIZADOS"
      }
    });
  });

  test('Normal - 10430915989', async () => {
    const result = await consulta_ruc_requester.fetch_data("20506343616");
    expect(result)
    .toEqual({
      ruc: "20506343616",
      razon_social: "CHEMAX S.A.C.",
      tipo_contribuyente: "SOCIEDAD IRREGULAR",
      nombre_comercial: "-",
      fecha_inscripcion: "14/04/2003",
      fecha_inicio_actividades: "17/05/2003",
      estado_contribuyente: "ACTIVO",
      condicion_contribuyente: "HABIDO",
      domicilio_fiscal: {
        direccion: "MZA. O LOTE. 25 URB. LAS FRESAS (A 2 CDRAS AV CANTA CALLAO - AV FAUCETT) PROV. CONST. DEL CALLAO - PROV. CONST. DEL CALLAO - CALLAO",
        provincia: "CALLAO",
        distrito: "",
      },
      sistema_emision_comprobante: "MANUAL/COMPUTARIZADO",
      actividad_exterior: "IMPORTADOR/EXPORTADOR",
      trabajadores: {
        "2024-03": 2,
        "2024-04": 2,
        "2024-05": 2,
        "2024-06": 2,
        "2024-07": 2,
        "2024-08": 2,
        "2024-09": 2,
        "2024-10": 2,
        "2024-11": 2,
        "2024-12": 2,
        "2025-01": 2,
        "2025-02": 2,
      },
      actividad_economica_principal: {
        cod: "4669",
        description: "VENTA AL POR MAYOR DE DESPERDICIOS, DESECHOS Y CHATARRA Y OTROS PRODUCTOS N.C.P.",
      },
      actividad_economica_secundaria: undefined,
    });
  });
});
