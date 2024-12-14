using ReticulaPWA.Models.DTOs;

namespace ReticulaPWA.Helpers
{
    public static class ConvertClassHelper
    {


        public static Informacion ToInformacionDTO(InformacionGeneral informacionGeneral, string numControl, string especialidad, int creditos, int semestreActual)
        {
            return new()
            {
                NumeroControl = numControl,
                NombreDelAlumno = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "NOMBRE DEL ALUMNO:")!.valor,
                Carrera = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "CARRERA:")!.valor.Split(" ")[1],
                PlanDeEstudios = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PLAN DE ESTUDIOS:")!.valor.Split(" ")[1],
                Especialidad = (!string.IsNullOrWhiteSpace(especialidad) && especialidad != "( )") ? especialidad.Substring(4, especialidad.Length - 4) : "Sin especialidad",
                CreditosAcumulados = double.Parse(informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "CR&EACUTE;DITOS ACUMULADOS:")!.valor),
                CreditosTotales = creditos,
                Vigencia = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "SITUACI&OACUTE;N DE VIGENCIA:")!.valor,
                PeriodosConvalidos = int.Parse(informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "N&UACUTE;MERO DE PERIODOS CONVALIDADOS:")!.valor),
                PeriodoActualUltimo = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PERIODO ACTUAL O ULTIMO:")!.valor.Split(" ")[2],
                SemestreActualUltimo = semestreActual,
                Curp = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "CLAVE CURP:")!.valor,
                FechaNacimiento = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "FECHA DE NACIMIENTO:")!.valor,
                Calle = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "CALLE:")!.valor,
                Num = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "NUM:")!.valor,
                Colonia = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "COLONIA:")!.valor,
                Ciudad = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "CIUDAD:")!.valor,
                CP = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "C.P.:")!.valor,
                TelefonoDomicilio = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "TEL&EACUTE;FONO DOMICILIO:")!.valor,
                TelefonoCelular = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "TEL&EACUTE;FONO CELULAR:")!.valor,
                Correo = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "CORREO ELECTR&OACUTE;NICO:")!.valor,
                EscuelaProcedencia = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "ESCUELA DE PROCEDENCIA:")!.valor,
                Tutor = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "TUTOR:")!.valor,

            };
        }
    }
}
