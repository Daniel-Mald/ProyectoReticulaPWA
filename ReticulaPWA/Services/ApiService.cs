using ReticulaPWA.Models;
using ReticulaPWA.Models.DTOs;
using System.Net;
using System.Net.Http;
using System.Text.Json;

namespace ReticulaPWA.Services
{
    public class ApiService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        string sieUri = "https://sie.itesrc.net/api/alumno/";
        public ApiService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;

        }
        public async Task<IEnumerable<KardexDTO>?> GetKardex(LoginDTO dto)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{sieUri}kardex?control={dto.NumeroControl}&password={dto.Password}");
            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                IEnumerable<KardexDTO>? content = JsonSerializer.Deserialize<IEnumerable<KardexDTO>>(json);
                if (content != null && content.Any())
                {
                    return content;
                }
            }
            return null;
        }
        public async Task<InformacionGeneral> GetInformacionGeneral(LoginDTO dto)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{sieUri}datosgenerales?control={dto.NumeroControl}&password={dto.Password}");
            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                IEnumerable<InformacionGeneralDTO>? content = JsonSerializer.Deserialize<IEnumerable<InformacionGeneralDTO>>(json);
                if (content != null && content.Any())
                {
                    InformacionGeneral info = new()
                    {
                        Informacion = content,
                        CredencialesIncorrectas = false,
                        Problemas = false
                    };
                    return info;
                }

            }
            InformacionGeneral inf = new();
            if ((int)response.StatusCode == 400) { inf.CredencialesIncorrectas = true; }
            else { inf.Problemas = true; }
            return inf;
        }
        public async Task<IEnumerable<MateriasDTO>?> GetMaterias(LoginDTO dto)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{sieUri}kardex?control={dto.NumeroControl}&password={dto.Password}");
            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                IEnumerable<MateriasDTO>? content = JsonSerializer.Deserialize<IEnumerable<MateriasDTO>>(json);
                if (content != null && content.Any())
                {
                    return content;
                }
            }
            return null;
        }
        public async Task<IEnumerable<HorarioDTO>?> GetHorario(string plan)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"https://horarios.itesrc.edu.mx/api/materias/{plan}");
            if (response.IsSuccessStatusCode)
            {
                var json = response.Content.ReadAsStringAsync().Result;
                IEnumerable<HorarioDTO>? content = JsonSerializer.Deserialize<IEnumerable<HorarioDTO>>(json);
                if (content != null && content.Any())
                {
                    return content;
                }
            }
            return null;
        }
        //public async Task<ComprobarCredenciales> ComprobarCredenciales(LoginDTO dto)
        //{
        //    var client = _httpClientFactory.CreateClient();
        //    var response = await client.GetAsync($"{sieUri}datosgenerales?control={dto.NumeroControl}&password={dto.Password}");
        //    if (response.IsSuccessStatusCode)
        //    {
        //        ComprobarCredenciales modelo = new ComprobarCredenciales()
        //        {
        //            Valido = true
        //        };
        //        return modelo;

        //    }
        //    ComprobarCredenciales mod = new ComprobarCredenciales()
        //    {
        //        Valido = false
        //    };
        //    return mod;

        //}
    }
}
