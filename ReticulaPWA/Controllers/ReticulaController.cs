using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using ReticulaPWA.Helpers;
using ReticulaPWA.Models.DTOs;
using ReticulaPWA.Services;
using System;
using System.Globalization;
using System.Numerics;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ReticulaPWA.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReticulaController : ControllerBase
    {
        ApiService apiService;
        public ReticulaController(ApiService apiService)
        {
            this.apiService = apiService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login3([FromBody] LoginDTO loginDto)
        {
            if (loginDto == null)
                return BadRequest("No se recibieron datos");

            if (string.IsNullOrWhiteSpace(loginDto.NumControl))
                ModelState.AddModelError("", "El número de control no puede estar vacio");

            else if (loginDto.NumControl.Length != 8)
                ModelState.AddModelError("", "El número de control debe tener 8 caracteres");

            if (string.IsNullOrWhiteSpace(loginDto.Password))
                ModelState.AddModelError("", "La contraseña no puede estar vacia");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            CredencialesModel Credenciales = new() { NumeroControl = loginDto.NumControl, Password = loginDto.Password };
            var logged = await apiService.FokinLogin(Credenciales);

            if (!logged)
                return BadRequest("Credenciales incorrectas");

            string credenciales = $"{loginDto.NumControl}-{loginDto.Password}";

            return Ok(credenciales);
        }

        [HttpGet("Reticula")]
        public async Task<IActionResult> GetReticula()
        {

            var headers = HttpContext.Request.Headers;

            headers.TryGetValue("NumControl", out StringValues numControl);
            headers.TryGetValue("Password", out StringValues password);

            if (StringValues.IsNullOrEmpty(numControl) || StringValues.IsNullOrEmpty(password))
                return BadRequest("No se recibieron datos");

            var dto = new LoginDTO
            {
                NumControl = numControl,
                Password = password
            };

            var informacionGeneral = await apiService.GetInformacionGeneral(dto);

            if (informacionGeneral == null)
                return NotFound();

            if (informacionGeneral.CredencialesIncorrectas == true)
                return BadRequest("Credenciales incorrectas");

            if (informacionGeneral.Problemas == true)
                return BadRequest("Ha ocurrido un problema");


            string plan = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PLAN DE ESTUDIOS:")!.valor;
            var kardexTask = apiService.GetKardex(dto);
            var horarioTask = apiService.GetHorario(dto);
            var materiasPlanTask = apiService.GetMateriasPlan(plan.Split(" ")[1]);

            var tasks = new List<Task>
                    {
                        kardexTask,
                        materiasPlanTask,
                        horarioTask
                    };

            try
            {
                await Task.WhenAll(tasks);

                if (kardexTask.Result == null || materiasPlanTask.Result == null || horarioTask.Result == null)
                {
                    return BadRequest("Una o más peticiones fallaron.");
                }

                var resultado = new
                {
                    Kardex = kardexTask.Result,
                    Materias = materiasPlanTask.Result,
                    Horario = horarioTask.Result
                };

                //quitar las de especialidad pendiente
                var materiasFromPlan = resultado.Materias.Select(x => new MateriaReticula
                {
                    Clave = x.clave.Replace("-", ""),
                    Nombre = x.nombre,
                    Semestre = x.semestre

                });

                var materiasFromKardex = resultado.Kardex.Select(x => new MateriaReticula
                {
                    Clave = x.clave,
                    Nombre = x.materia,
                    Oportunidad = x.oportunidad
                }).ToList();


                int semestreActual = ToValues.ObtenerSemestreActual(informacionGeneral);
                
           
                foreach (var item in materiasFromKardex)
                {
                    KardexDTO? matInKardex = resultado.Kardex.LastOrDefault(x => x.clave == item.Clave) as KardexDTO;

                    int semesstre = 0;

                    var propiedadesSemestre = typeof(KardexDTO)
                         .GetProperties()
                         .Where(p => p.Name.StartsWith("semestre") && p.PropertyType == typeof(int));


                    foreach (var s in propiedadesSemestre)
                    {

                        var ss = (int)s.GetValue(matInKardex)!;

                        if (ss != 0)
                        {
                            semesstre = ss;
                        }

                    }
                    if (semesstre != 0)
                        item.Semestre = semesstre;

                    if (matInKardex!.promedio == "N.A")
                    {
                        item.Estado = "No acreditada";
                    }
                    else
                    {
                        item.Estado = "Acreditada";

                        if (double.TryParse(matInKardex.promedio, out double promedio))
                        {
                            item.Promedio = (int)promedio;
                        }
                    }


                    var materiaActualizada = horarioTask.Result
                          .FirstOrDefault(materiaHorario => materiaHorario.clave.Split(" ")[0] == item.Clave);

                    if (materiaActualizada != null)
                    {
                        item.Estado = "Cursando";
                        item.Semestre = semestreActual;
                    }
                }
                foreach (var item in materiasFromPlan)
                {
                    if (materiasFromKardex.FirstOrDefault(x => x.Clave == item.Clave) == null
                        && materiasFromKardex.FirstOrDefault(x => x.Nombre == item.Nombre) == null)
                    {
                        MateriaReticula nuevaMateriaReticula = new()
                        {
                            Nombre = item.Nombre,
                            Clave = item.Clave,
                            Semestre = item.Semestre
                        };
                        if (resultado.Horario.FirstOrDefault(x => x.clave.Split(" ")[0] == item.Clave) != null ||
                            resultado.Horario.FirstOrDefault(x => x.nombre == item.Nombre) != null)
                        {
                            nuevaMateriaReticula.Estado = "Cursando";
                            //var sem = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PERIODO ACTUAL O ULTIMO:")!.valor.Substring(1, 2);
                            //nuevaMateriaReticula.Semestre = int.Parse(sem);
                            nuevaMateriaReticula.Semestre = semestreActual;
                        }
                        else
                        {
                            nuevaMateriaReticula.Estado = "Sin cursar";
                        }



                        materiasFromKardex.Add(nuevaMateriaReticula);
                    }
                }

                List<Semestre> semestres = [];

                int semestreReticula = (semestreActual <= 9 ) ? 9 : semestreActual;
                var kardexLimpio = materiasFromKardex
                    .Where(x => !x.Clave.StartsWith("TUT") && 
                            x.Clave != "ACA0001" && 
                           !x.Clave.StartsWith("ING") && 
                           !x.Clave.StartsWith("SR") && 
                           !x.Clave.StartsWith("EXT") && 
                           !x.Clave.StartsWith("SSY"))
                    .ToList();

                for (int i = 1; i <= semestreReticula; i++)
                {
                    semestres.Add(new()
                    {
                        Numero = i,
                        Materias = [..kardexLimpio.Where(x => x.Semestre == i)]

                    });

                }

                return Ok(semestres);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error en las peticiones: {ex.Message}");
            }
        }

        [HttpGet("Perfil")]
        public async Task<IActionResult> GetInfoGeneral()
        {
            try
            {

                var headers = HttpContext.Request.Headers;

                if (!headers.TryGetValue("NumControl", out StringValues numControl) ||
                    !headers.TryGetValue("Password", out StringValues password))
                    return BadRequest("No se recibieron datos válidos.");

                if (string.IsNullOrWhiteSpace(numControl) || string.IsNullOrWhiteSpace(password))
                    return BadRequest("No se recibieron datos válidos.");

                var dto = new LoginDTO
                {
                    NumControl = (string?)numControl ?? "",
                    Password = (string?)password ?? ""
                };

                var informacionGeneral = await apiService.GetInformacionGeneral(dto);

                Match match = Regex.Match(informacionGeneral.Informacion!
                    .FirstOrDefault(x => x.dato == "PLAN DE ESTUDIOS:")!.valor, @"\bDE\s+(\d+)\b");
                int creditos = 0;

                string especialidad = informacionGeneral.Informacion!
                    .FirstOrDefault(x => x.dato == "M&OACUTE;DULO DE ESPECIALIDAD:")!.valor;
                if (match.Success)
                {
                    creditos = int.Parse(match.Groups[1].Value);
                }
                int semestreActual = 0;
                Match match2 = Regex.Match(informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PERIODO ACTUAL O ULTIMO:")!.valor, @"^\((\d+)\)");

                if (match2.Success)
                {
                    semestreActual = int.Parse(match2.Groups[1].Value);
                }

                Informacion infoGeneral =  ConvertClassHelper.ToInformacionDTO(informacionGeneral, numControl, especialidad, creditos, semestreActual);

                return Ok(infoGeneral);
            }
            catch (Exception ex)
            {

                return BadRequest($"Error en las peticiones: {ex.Message}");
            }
        }


        [HttpGet("Horario")]
        public async Task<IActionResult> Horario()
        {
            var headers = HttpContext.Request.Headers;

            headers.TryGetValue("NumControl", out StringValues numControl);
            headers.TryGetValue("Password", out StringValues password);

            if (StringValues.IsNullOrEmpty(numControl) || StringValues.IsNullOrEmpty(password))
                return BadRequest("No se recibieron datos");

            var credenciales = new LoginDTO
            {
                NumControl = numControl,
                Password = password
            };

            var horario = await apiService.GetHorario(credenciales);

            if (horario == null || !horario.Any())
                return BadRequest("No se encontro el horario del alumno.");


            Dictionary<string, List<MateriaHorarioDTO>> horarioDic = MethodsStatic.CrearDiccionarioMateria(horario);


            return Ok(horarioDic);
        }

    }
}
