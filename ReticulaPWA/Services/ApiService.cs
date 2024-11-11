using HtmlAgilityPack;
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
        public async Task<IEnumerable<KardexDTO>?> GetKardex(CredencialesModel dto)
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
        public async Task<bool> FokinLogin(CredencialesModel model)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync("https://intertec.tec-carbonifera.edu.mx/");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(content);

            // Aquí, se asume que el formulario tiene un campo de usuario y contraseña con los nombres "username" y "password"
            var formValues = new FormUrlEncodedContent(new[]
            {
            new KeyValuePair<string, string>("Control", model.NumeroControl),
            new KeyValuePair<string, string>("password", model.Password),
            new KeyValuePair<string, string>("Opc","MAIN")
            });

            // Envía la solicitud de autenticación
            var loginResponse = await client.PostAsync("https://intertec.tec-carbonifera.edu.mx/cgi-bin/sie.pl", formValues);

            // Analiza la respuesta para verificar si la autenticación fue exitosa
            var loginContent = await loginResponse.Content.ReadAsStringAsync();

            // Validar un mensaje de éxito o redirección
            var x =  loginContent.Contains("Password incorrecto, usuario");
            
            if (x)
            {
                return false;
            }
            else
            {
                return true;
            }
            //}
            
        }
        public async Task<InformacionGeneral> GetInformacionGeneral(CredencialesModel dto)
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
        public async Task<IEnumerable<MateriasDTO>?> GetMateriasPlan(string plan)
        {
            var client = _httpClientFactory.CreateClient();
             var response = await client.GetAsync($"https://horarios.itesrc.edu.mx/api/materias/{plan}");

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
        public async Task<IEnumerable<HorarioDTO>?> GetHorario(CredencialesModel dto)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{sieUri}horario?control={dto.NumeroControl}&password={dto.Password}");

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
