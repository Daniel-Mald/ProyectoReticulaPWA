namespace ReticulaPWA.Models.DTOs
{
    public class KardexDTO
    {
        public string clave { get; set; } = null!;
        public string materia { get; set; } = null!;
        public string promedio { get; set; } = null!;
        public int oportunidad { get; set; }
        public int semestre1 { get; set; }
        public string periodo1 { get; set; } = null!;
        public int semestre2 { get; set; }
     //   public string? periodo2 { get; set; } 
        public int semestre3 { get; set; }
       // public string? periodo3 { get; set; } 
        public int semestre4 { get; set; }
        //public string? periodo4 { get; set; } 
        public int semestre5 { get; set; }
      //  public string? periodo5 { get; set; }
        public int semestre6 { get; set; }
       // public string? periodo6 { get; set; }
    }
}
