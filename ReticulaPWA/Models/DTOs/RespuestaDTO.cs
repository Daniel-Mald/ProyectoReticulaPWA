namespace ReticulaPWA.Models.DTOs
{
    public class RespuestaDTO
    {
        public Informacion InformacionGeneral { get; set; } = null!;
    }
    public class Informacion
    {
        public string NombreDelAlumno { get; set; } = null!;
        public string Carrera { get; set; } = null!;
        public string PlanDeEstudios { get; set; } = null!;
        public string Especialidad { get; set; } = "";
        public int CreditosAcumulados { get; set; }
        public int CreditosTotales { get; set; }
        public string Vigencia { get; set; } = null!;
        public int PeriodosConvalidos { get; set; }
        public string PeriodoActualUltimo { get; set; } = null!;
        public int SemestreActualUltimo { get; set; }
        public string Curp { get; set; } = null!;
        public DateTime FechaNacimiento { get; set; }
        public string Calle { get; set; } = "";
        public string Num { get; set; } = "";
        public string Colonia { get; set; } = "";
        public string Ciudad { get; set; } = "";
        public string CP { get; set; } = "";
        public string TelefonoDomicilio { get; set; } = "";
        public string TelefonoCelular { get; set; } = "";
        public string Correo { get; set; } = "";
        public string EscuelaProcedencia { get; set; } = "";
        public string Tutor { get; set; } = "";
    }
    public class MateriaReticula
    {
        public string Nombre { get; set; } = null!;
        public string Clave { get; set; } = null!;
        public string Estado { get; set; } = null!;
        public int Oportunidad { get; set; }
    }
}
