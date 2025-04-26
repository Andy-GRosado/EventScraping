import { load } from "cheerio";
import { IConsultaRuc } from "../utils/interfaces";

export abstract class BaseRequester<T, U> {
  public abstract fetch_data(data: T): Promise<U>
}

export class ConsultaRucRequester extends BaseRequester<string, IConsultaRuc> {
  private base_url: string;
  private method: string;
  private headers: any;
  private payload_general: any;
  private payload_trabajadores: any;

  constructor() {
    super()
    this.base_url = 'https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias';
    this.method = 'POST';
    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this.payload_general = {
      accion: 'consPorRuc',
      nroRuc: '20123456789',
      token: '17weghazm68ik95e33loa9ut2ttomx0rn9b0wf6izye2tllztqy2',
      contexto: 'ti-it',
      modo: '1'
    };
    this.payload_trabajadores = {
      accion: 'getCantTrab',
      nroRuc: '20123456789',
      contexto: 'ti-it',
      modo: '1'
    };
  }

  override async fetch_data(data: string): Promise<IConsultaRuc> {
    try {
      this.payload_general['nroRuc'] = data;
      this.payload_trabajadores['nroRuc'] = data;

      // Fetching the responses for both endpoints
      let response_general = await fetch(this.base_url, {
        method: this.method,
        headers: this.headers,
        body: new URLSearchParams(this.payload_general).toString()
      });

      let response_trabajadores = await fetch(this.base_url, {
        method: this.method,
        headers: this.headers,
        body: new URLSearchParams(this.payload_trabajadores).toString()
      });

      // Check if both responses are OK
      if (!response_general.ok || !response_trabajadores.ok) {
        throw new Error(`HTTP error! status: ${response_general.status}`);
      }

      // Ensure proper decoding from ISO-8859-1 to UTF-8
      const getUtf8Text = async (response: Response): Promise<string> => {
        const contentType = response.headers.get('Content-Type');
        const charsetMatch = contentType?.match(/charset=([a-zA-Z0-9-]+)/);
        const charset = charsetMatch ? charsetMatch[1] : 'utf-8'; // Por defecto UTF-8 si no se encuentra el charset
        const decoder = new TextDecoder(charset);
        const decodedText = decoder.decode(await response.arrayBuffer());
        return decodedText;
      };
      let html_general = await getUtf8Text(response_general);
      let html_trabajadores = await getUtf8Text(response_trabajadores);


      // Parsing workers from the response
      const parseWorkers = (html: string) => {
        const document = load(html);
        const table = document('table.table');
        if (!table.length) return undefined;

        const result: { [key: string]: number } = {};
        table.find('tbody tr').each((_, row) => {
          const columns = document(row).find('td');
          result[document(columns[0]).text().trim()] = [1, 2, 3].reduce((acc, current) => {
            acc += parseInt(document(columns[current]).text().trim()) || 0;
            return acc;
          }, 0);
        });
        return result;
      };

      // Parsing the Peruvian address
      const parsePeruvianAddress = (address: string): {direccion: string, provincia: string, distrito: string} => {
        const provincias = ['LIMA', 'CALLAO', 'CANTA', 'CAÑETE', 'HUAURA', 'OYON', 'YAUYOS'];
        const distritos = [
          'ANCON', 'ATE', 'BARRANCO', 'BREÑA', 'CARABAYLLO', 'CHACLACAYO', 'CHORRILLOS', 'CERCADO DE LIMA',
          'COMAS', 'EL AGUSTINO', 'INDEPENDENCIA', 'JESUS MARIA', 'LA MOLINA', 'LA VICTORIA', 'LIMA',
          'LINCE', 'LOS OLIVOS', 'MAGDALENA DEL MAR', 'MIRAFLORES', 'PACHACAMAC', 'PUEBLO LIBRE',
          'RIMAC', 'SAN BARTOLO', 'SAN ISIDRO', 'SAN JUAN DE LURIGANCHO', 'SAN JUAN DE MIRAFLORES',
          'SAN LUIS', 'SAN MARTIN DE PORRES', 'SAN MIGUEL', 'SANTA ANITA', 'SANTA MARIA DEL MAR',
          'SANTIAGO DE SURCO', 'SURQUILLO', 'VILLA EL SALVADOR', 'VILLA MARIA DEL TRIUNFO'
        ];

        let result = {
          direccion: address.trim(),
          provincia: '',
          distrito: ''
        };
        if (address.split('-').length >= 3) {
          result.provincia = provincias.find((item) => address.split('-')[1].includes(item)) || '';
          result.distrito = distritos.find((item) => address.split('-')[2].includes(item)) || '';
        }
        return result;
      };

      // Parsing the economic activity
      const parseEconomicActivity = (raw_data: string | undefined): { cod: string, description: string } | undefined => {
        if (raw_data == undefined) return raw_data;

        let values = raw_data.split('-').map((item) => item.trim());
        return {
          cod: values[1],
          description: values[2]
        };
      };

      // Parsing the business data
      const parseBusiness = async (ruc: string, html_general: string, html_trabajadores: string): Promise<IConsultaRuc> => {
        let document = load(html_general);
        let data_general = document('.list-group-item');
        if (data_general.length === 0) {
          throw new Error('No data found');
        }

        let raw_data: IConsultaRuc = {
          ruc: ruc,
          razon_social: document('div:contains("Número de RUC:")').closest('.list-group-item').find('.row .col-sm-7 h4').text().trim().split('-').slice(1).join('-').trim(),
          tipo_contribuyente: document('div:contains("Tipo Contribuyente:")').closest('.list-group-item').find('.row .col-sm-7 p').text().trim(),
          nombre_comercial: document('div:contains("Nombre Comercial:")').closest('.list-group-item').find('.row .col-sm-7 p').text().replace('Afecto al Nuevo RUS: SI', '').trim(),
          fecha_inscripcion: document('div:contains("Fecha de Inscripción:")').closest('.list-group-item').find('.row .col-sm-3 p').eq(0).text().trim(),
          fecha_inicio_actividades: document('div:contains("Fecha de Inicio de Actividades:")').closest('.list-group-item').find('.row .col-sm-3 p').eq(1).text().trim(),
          estado_contribuyente: document('div:contains("Estado del Contribuyente:")').closest('.list-group-item').find('.row .col-sm-7 p').text().split('Fecha')[0].trim(),
          condicion_contribuyente: document('div:contains("Condición del Contribuyente:")').closest('.list-group-item').find('.row .col-sm-7 p').text().split('Fecha')[0].trim(),
          domicilio_fiscal: parsePeruvianAddress(document('div:contains("Domicilio Fiscal:")').closest('.list-group-item').find('.row .col-sm-7 p').text().replace(/\s+/g, ' ')),
          sistema_emision_comprobante: document('div:contains("Sistema Emisión de Comprobante:")').closest('.list-group-item').find('.row .col-sm-3 p').eq(0).text().trim(),
          actividad_exterior: document('div:contains("Actividad Comercio Exterior:")').closest('.list-group-item').find('.row .col-sm-3 p').eq(1).text().trim(),
          trabajadores: parseWorkers(html_trabajadores),
          actividad_economica_principal: parseEconomicActivity(document('div:contains("Actividad(es) Económica(s):")').closest('.list-group-item').find('tbody tr td').map((index, element) => document(element).text()).get()[0]),
          actividad_economica_secundaria: parseEconomicActivity(document('div:contains("Actividad(es) Económica(s):")').closest('.list-group-item').find('tbody tr td').map((index, element) => document(element).text()).get()[1] || undefined),
          last_update: new Date(Date.now()),
        };
        return raw_data;
      };

      return await parseBusiness(data, html_general, html_trabajadores);
    } catch (e: any) {
      throw Error(`Error fetching data for RUC ${data}: ${e.message}`);
    }
  }
}

export class ChecaTuLineaRequester extends BaseRequester<string, any> {
  private base_url: string;
  private method: string;
  private headers: any;
  private payload: any;

  constructor() {
      super()
      this.base_url = 'https://checatuslineas.osiptel.gob.pe/Consultas/GetAllCabeceraConsulta/';
      this.method = 'POST';
      this.headers = {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      };
      this.payload = {
          'columns[0][data]': '0',
          'columns[0][name]': 'indice',
          'order[0][column]': '0',
          'order[0][dir]': 'asc',
          'length': '10000',
          'models[IdTipoDoc]': '2',
          'models[NumeroDocumento]': '20123456789',
          'models[ReCaptcha]': '03AFcWeA6430-l0mzlJAkRl4ezWPZBnfDwmhicALJPJ1cXS0i4-fXxbaxpziB-gki-xjmqrjwsd74qyyRsE1o7L_-f-SxJtSeYOI19b1mZQv3K9i1zuH2xtPYg8R7zyYcvTBliT0UITmcBnoK70z_onFY5r7eFgLlp_7MCr62zhF5WYwcRphrTz7v3BYBGMSjKFmG6UakyJowZVMg0a6iBkM33BuG7pxh17TG7n3TYJ2-9vUx4G5KKKNT_KR7qliZbIE3WfJQ5ry1VYvAWrwb0v-opQELxf443_t__V5X2rY-zhgeslCqmHPl1w5F5tpKL8Zpa1hJJy_MnwtogXEo-x1hOn2N4DuAibJxg_w3XS3jdafIhSf5drEyON8xXJlYjxdo1tKLCKjoeDJA8Yjn9Kwfsj6tU-pYLrq2r2q4dNyRskL8DVJJRzH5z6fFI9I63Rt0Uy0K4H2kX0TaJ5v0dfGHtBs6CBXZF1n7u8fCiHVn8Fpvu-Zcl4-x1cXhpCKeqNCCKn0Lz9NcJW5Iks7xG6hCX0HmR0mHgBKCNs-F1zxqP4Mwu5NZ7s6Q9-HBPXj6rtGTabW8k1q6_fcsF4uhOW_vwBfDqhGKuM_s65EOKuDvlHd-eQQuioTLtWY4rPTsSOjJ1ZPq85xSqIefXheFjFCTOw4GEb7TScFuizPjL81fDVQI3vsbPrYwh6GTftDBa_MNQhtw1Wu7RRfyRnaqhONf5YY8K6HvQrqppuw3pDcEUr6F-CclacuUyLOtxBFROCStYau0YBfXe4Bh0RWPkuNlOoGwmXt-q1RVARd1I2BU2a6Ttc5fMj86dzYOeoNpS9aF3sGpXRnBUJujCb12pD2vfm_e88YoFU0mxsExutkrYQSmXz6biU9btvzl8VPUpm-6-KiUZCewUeBssvbgamZWod34Fxy-ZNsXBUvbZU9BfBIf4qOjP9i0OeMcmHEHhAIrpYsQEyZqv',
          'models[GoogleCaptchaToken]': '03AFcWeA6430-l0mzlJAkRl4ezWPZBnfDwmhicALJPJ1cXS0i4-fXxbaxpziB-gki-xjmqrjwsd74qyyRsE1o7L_-f-SxJtSeYOI19b1mZQv3K9i1zuH2xtPYg8R7zyYcvTBliT0UITmcBnoK70z_onFY5r7eFgLlp_7MCr62zhF5WYwcRphrTz7v3BYBGMSjKFmG6UakyJowZVMg0a6iBkM33BuG7pxh17TG7n3TYJ2-9vUx4G5KKKNT_KR7qliZbIE3WfJQ5ry1VYvAWrwb0v-opQELxf443_t__V5X2rY-zhgeslCqmHPl1w5F5tpKL8Zpa1hJJy_MnwtogXEo-x1hOn2N4DuAibJxg_w3XS3jdafIhSf5drEyON8xXJlYjxdo1tKLCKjoeDJA8Yjn9Kwfsj6tU-pYLrq2r2q4dNyRskL8DVJJRzH5z6fFI9I63Rt0Uy0K4H2kX0TaJ5v0dfGHtBs6CBXZF1n7u8fCiHVn8Fpvu-Zcl4-x1cXhpCKeqNCCKn0Lz9NcJW5Iks7xG6hCX0HmR0mHgBKCNs-F1zxqP4Mwu5NZ7s6Q9-HBPXj6rtGTabW8k1q6_fcsF4uhOW_vwBfDqhGKuM_s65EOKuDvlHd-eQQuioTLtWY4rPTsSOjJ1ZPq85xSqIefXheFjFCTOw4GEb7TScFuizPjL81fDVQI3vsbPrYwh6GTftDBa_MNQhtw1Wu7RRfyRnaqhONf5YY8K6HvQrqppuw3pDcEUr6F-CclacuUyLOtxBFROCStYau0YBfXe4Bh0RWPkuNlOoGwmXt-q1RVARd1I2BU2a6Ttc5fMj86dzYOeoNpS9aF3sGpXRnBUJujCb12pD2vfm_e88YoFU0mxsExutkrYQSmXz6biU9btvzl8VPUpm-6-KiUZCewUeBssvbgamZWod34Fxy-ZNsXBUvbZU9BfBIf4qOjP9i0OeMcmHEHhAIrpYsQEyZqv'
      };
  }

  countByCompany(list_phones: {id: string, type: string, number: string, company: string}[]) {
      let final_data: any[] = [];
      let companies = list_phones.map((phone) => {
          return phone['company']
      });
      companies = Array.from(new Set(companies));
      companies.forEach((company) => {
          let phones_by_company = list_phones.filter((value) => value['company'] === company)
          let types_by_company = phones_by_company.map((phone) => {
              if (phone['company'] === company){
                  return phone['type'];
              }
          });
          types_by_company = Array.from(new Set(types_by_company));
          let types_list: any[] = [];
          types_by_company.forEach((type) => {
              types_list.push({type: type, count: phones_by_company.filter((value) => value['type'] === type).length});
          });
          types_by_company = Array.from(new Set(types_by_company));
          final_data.push({company: company, count: phones_by_company.length, lines: types_list});
      })

      return final_data;
  }

  transformData(list_phones: string[][]) {
      let new_list = list_phones.map((phone) => {
          let new_obj = {id: phone[0], type: phone[1], number: phone[2], company: phone[3]};
          return new_obj;
      })
      return new_list;
  }

  public override async fetch_data(ruc: string): Promise<any> {
      this.payload['models[NumeroDocumento]'] = ruc;
      let response = await fetch(this.base_url,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams(this.payload).toString()
        }
      );
      let json_response = await response.json();
      if (json_response['iTotalRecords'] === 0) {
        return [];
      }
      // await sleep(2000 + Math.random() * 1000);
      return {
        ruc: ruc,
        data: this.countByCompany(this.transformData(json_response['aaData']))
      };
  }
}
