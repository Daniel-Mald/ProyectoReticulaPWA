namespace ReticulaPWA.Models.DTOs
{
    public class InformacionGeneralDTO
    {
        public string dato { get; set; } = "";
        public string valor { get; set; } = "";
    }
    public class InformacionGeneral
    {
        public IEnumerable<InformacionGeneralDTO>? Informacion { get; set; }
        public bool CredencialesIncorrectas { get; set; } = false;
        public bool Problemas { get; set; } = false;
    }
}
