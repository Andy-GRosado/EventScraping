import { Connection, Model, Schema } from "mongoose";
import { BaseRequester, ChecaTuLineaRequester, ConsultaRucRequester } from "./request.handler";
import { ChecaTuLineaSchema, ConsultaRucSchema } from "../controllers/db.controller";
import { IChecaTuLinea, IChecaTuLineaSchema, IConsultaRuc, IConsultaRucSchema } from "../utils/interfaces";

export abstract class BaseObjectHandler<T, U, V extends U> {
  protected status: {
    processed: T[],
    success: U[],
    updated: any[],
    error: any[]
  } = {
    processed: [],
    success: [],
    updated: [],
    error: []
  }
  protected db_model: Model<V>;

  constructor(protected requester: BaseRequester<T, U>, connection: Connection, collection_name: string, schema: Schema<V>) {
    this.db_model = connection.model<V>(collection_name, schema);
  }

  public async singleRequest(obj: T): Promise<{ processed: any[], success: any[], error: any[] }> {
    await this.bulkRequest([obj]);
    return this.status;
  }

  public async singleAndUpdate(obj: T, pk: string): Promise<{ processed: any[], success: any[], error: any[] }> {
    await this.bulkRequestAndUpdate([obj]);
    return this.status;
  }

  public async bulkRequest(list_obj: T[]): Promise<{ processed: any[], success: any[], error: any[] }> {
    this.status = {
      processed: [],
      success: [],
      updated: [],
      error: []
    }
    this.status.processed = list_obj;
    let result = await Promise.allSettled(list_obj.map((item) => this.requester.fetch_data(item)));
    result.forEach(res => {
      (res.status == 'fulfilled') ? this.status.success.push(res.value) : this.status.error.push(res.reason);
    });
    return this.status;
  }

  public async bulkRequestAndUpdate(list_obj: T[]): Promise<{ processed: any[], success: any[], error: any[] }> {
    this.status = {
      processed: [],
      success: [],
      updated: [],
      error: []
    }
    this.status.processed = list_obj;
    let result = await Promise.allSettled(list_obj.map((item) => this.requester.fetch_data(item)));
    result.forEach(res => {
      (res.status == 'fulfilled') ? this.status.success.push(res.value) : this.status.error.push(res.reason);
    });
    await this.bulkSaving(this.status.success);
    return this.status;
  }

  public async bulkSaving(obj: U[]): Promise<void> {};

  public getStatus(): { processed: T[], success: U[], error: any[] } {
    return this.status;
  }
}

export class ConsultaRucHandler extends BaseObjectHandler<string, IConsultaRuc, IConsultaRucSchema> {
  constructor(connection: Connection) {
    super(new ConsultaRucRequester(), connection, 'consulta_ruc_2', ConsultaRucSchema);
  }
  override async bulkSaving(obj: IConsultaRuc[]): Promise<void> {
    await Promise.all(obj.map((item) =>
      this.db_model.findOneAndUpdate(
        { ruc: item.ruc },
        {
          $set: {
            ruc: item.ruc,
            razon_social: item.razon_social,
            tipo_contribuyente: item.tipo_contribuyente,
            nombre_comercial: item.nombre_comercial,
            fecha_inscripcion: item.fecha_inscripcion,
            fecha_inicio_actividades: item.fecha_inicio_actividades,
            estado_contribuyente: item.estado_contribuyente,
            condicion_contribuyente: item.condicion_contribuyente,
            domicilio_fiscal: {
              direccion: item.domicilio_fiscal.direccion,
              provincia: item.domicilio_fiscal.provincia,
              distrito: item.domicilio_fiscal.distrito
            },
            sistema_emision_comprobante: item.sistema_emision_comprobante,
            actividad_exterior: item.actividad_exterior,
            trabajadores: item.trabajadores,
            actividad_economica_principal: item.actividad_economica_principal,
            actividad_economica_secundaria: item.actividad_economica_secundaria,
            last_update: Date.now()
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      )
    ));
    this.status.updated = obj;
  }
}

export class ChecaTuLineaHandler extends BaseObjectHandler<string, IChecaTuLinea, IChecaTuLineaSchema> {
  constructor(connection: Connection) {
    super(new ChecaTuLineaRequester(), connection, 'checa_tu_linea', ChecaTuLineaSchema);
  }
  override async bulkSaving(obj: IChecaTuLinea[]): Promise<void> {
    await Promise.all(obj.map((item) => {
      this.db_model.findOneAndUpdate(
        { ruc: item.ruc },
        {
          $set: {
            data: item.data,
            last_update: Date.now()
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      )
    }));
  }
}


