
import mongoose, { Schema } from "mongoose";
import { IChecaTuLinea, IConsultaRucSchema } from "../utils/interfaces";

export function getConnection (host: string, port: string, db: string,
    authentication?: { db_authentication: string, db_username: string, db_password: string }): mongoose.Connection {
    let string_connection = `mongodb://${authentication ? `${authentication.db_username}:${authentication.db_password}@` : ''}${host}:${port}/${db}${authentication ? `?authSource=${authentication.db_authentication}` : ''}`;
    return mongoose.createConnection(string_connection)
}

export function setCurrentConnection (host: string, port: string, db: string,
  authentication?: { db_authentication: string, db_username: string, db_password: string }) {
  let string_connection = `mongodb://${authentication ? `${authentication.db_username}:${authentication.db_password}@` : ''}${host}:${port}/${db}${authentication ? `?authSource=${authentication.db_authentication}` : ''}`;
  mongoose.connect(string_connection);
}

export const current_connection = mongoose.connection;


export const ConsultaRucSchema: Schema = new Schema<IConsultaRucSchema>({
  ruc: {
    type: String
  },
  razon_social: {
    type: String,
  },
  tipo_contribuyente: {
    type: String
  },
  nombre_comercial: {
    type: String,
  },
  fecha_inscripcion: {
    type: String,
  },
  fecha_inicio_actividades: {
    type: String,
  },
  estado_contribuyente: {
    type: String,
  },
  condicion_contribuyente: {
    type: String,
  },
  domicilio_fiscal: {
    direccion: {
      type: String,
    },
    provincia: {
      type: String,
    },
    distrito: {
      type: String,
    },
  },
  sistema_emision_comprobante: {
    type: String,
  },
  actividad_exterior: {
    type: String,
  },
  trabajadores: {
    type: Object
  },
  actividad_economica_principal: {
    type: {
      cod: {
        type: String,
      },
      description: {
        type: String,
      }
    }
  },
  actividad_economica_secundaria: {
    type: {
      cod: {
        type: String,
      },
      description: {
        type: String,
      }
    }
  },
  last_update: {
    type: Date,
    required: true,
    default: Date.now
  }
});

export const ChecaTuLineaSchema: Schema = new Schema<IChecaTuLinea>({
  ruc: {
    type: String
  },
  data: {
    type: [Object]
  },
  last_update: {
    type: Date,
    required: true,
    default: Date.now
  }
});

// export const ConsultaRucModel = mongoose.model<IConsultaRuc>('consulta_ruc_2', ConsultaRucSchema);
// export const ChecaTuLineaModel = mongoose.model<IChecatTuLinea>('checa_tu_linea', ChecaTuLineaSchema);

