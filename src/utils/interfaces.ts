import { Document } from "mongoose"

export interface IRegister {
  periodo: string,
  data: any[],
  last_update: Date
}

export interface IConsultaRuc {
  ruc: string,
  razon_social: string,
  tipo_contribuyente: string,
  nombre_comercial: string,
  fecha_inscripcion: string,
  fecha_inicio_actividades: string,
  estado_contribuyente: string,
  condicion_contribuyente: string,
  domicilio_fiscal: {
    direccion: string,
    provincia: string,
    distrito: string
  },
  sistema_emision_comprobante: string,
  actividad_exterior: string,
  trabajadores: any,
  actividad_economica_principal: {
    cod: string,
    description: string
  } | undefined,
  actividad_economica_secundaria: {
    cod: string,
    description: string
  } | undefined,
  last_update: Date
}

export interface IChecaTuLinea {
  ruc: string,
  data: {
    company: 'string',
    count: number,
    lines: {
      type: string,
      count: string
    }[]
  }[],
  last_update: Date
}


export interface IConsultaRucSchema extends IConsultaRuc, Document {}
export interface IChecaTuLineaSchema extends IChecaTuLinea, Document {}

export interface IRegMovilModel extends IRegister, Document {}
export interface IRegFijaModel extends IRegister, Document {}
export interface IRegClawbackModel extends IRegister, Document {}


