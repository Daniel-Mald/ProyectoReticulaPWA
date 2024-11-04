namespace ReticulaPWA.Models.DTOs
{
    public class MateriasDTO
    {
        public int id { get; set; }
        public string clave { get; set; } = "";
        public string nombre { get; set; } = "";
        public int teoricas { get; set; }
        public int practicas { get; set; }
        public int creditos { get; set; }
        public int semestre { get; set; }
        public string carrera { get; set; } = "";
        public string plan { get; set; } = "";
    }
}
