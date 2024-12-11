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

            return Ok();
        }

        [HttpGet("Reticula")]
        public async Task<IActionResult> GetReticula()
        {

            var headers = HttpContext.Request.Headers;

            headers.TryGetValue("NumControl", out StringValues numControl);
            headers.TryGetValue("Password", out StringValues password);

            if(StringValues.IsNullOrEmpty(numControl) || StringValues.IsNullOrEmpty(password))
                return BadRequest("No se recibieron datos");

            var dto = new LoginDTO
            {
                NumControl = numControl,
                Password = password
            };

            #region ValidacionCredenciales
            if (dto == null)
                return BadRequest("No se recibieron datos");

            if (string.IsNullOrWhiteSpace(dto.NumControl))
                ModelState.AddModelError("", "El número de control no puede estar vacio");
            else if (dto.NumControl.Length != 8)
                ModelState.AddModelError("", "El número de control debe tener 8 caracteres");

            if (string.IsNullOrWhiteSpace(dto.Password))
                ModelState.AddModelError("", "La contraseña no puede estar vacia");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            #endregion
            #region Obtener Reticula
            // cambiar por obtener plan de estudios
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

            //hacer las peticiones
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


                int semestreActual = 0;
                Match match2 = Regex.Match(informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PERIODO ACTUAL O ULTIMO:")!.valor, @"^\((\d+)\)");

                if (match2.Success)
                {
                    semestreActual = int.Parse(match2.Groups[1].Value);
                }

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

                List<Semestre> semestres = new List<Semestre>();


                for (int i = 0; i < semestreActual; i++)
                {
                    int s = i + 1;
                    Semestre newSemestre = new();
                    newSemestre.Numero = s;

                    newSemestre.Materias = materiasFromKardex.Where(x => x.Semestre == s && !x.Clave.StartsWith("TUT")
                    && x.Clave != "ACA0001" && !x.Clave.StartsWith("ING") && !x.Clave.StartsWith("SR") && !x.Clave.StartsWith("EXT") && !x.Clave.StartsWith("SSY"));
                    semestres.Add(newSemestre);

                }
                #endregion

                return Ok(semestres);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error en las peticiones: {ex.Message}");
            }
        }
       
        
        [HttpGet("InformacionGeneral")]
        public async Task<IActionResult> GetInfoGeneral()
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


            #region ValidacionCredenciales
            if (dto == null)
                return BadRequest("No se recibieron datos");

            if (string.IsNullOrWhiteSpace(dto.NumControl))
                ModelState.AddModelError("", "El número de control no puede estar vacio");
            else if (dto.NumControl.Length != 8)
                ModelState.AddModelError("", "El número de control debe tener 8 caracteres");

            if (string.IsNullOrWhiteSpace(dto.Password))
                ModelState.AddModelError("", "La contraseña no puede estar vacia");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            #endregion
            try
            {
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




                Informacion infoGeneral = new()
                {

                    NombreDelAlumno = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "NOMBRE DEL ALUMNO:")!.valor,
                    Carrera = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "CARRERA:")!.valor.Split(" ")[1],
                    PlanDeEstudios = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PLAN DE ESTUDIOS:")!.valor.Split(" ")[1],
                    Especialidad = especialidad.Substring(4, especialidad.Length - 4),
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



                return Ok(infoGeneral);
            }
            catch (Exception ex)
            {

                return BadRequest($"Error en las peticiones: {ex.Message}");
            }
        }


        [HttpGet("horario")]
        public async Task<IActionResult> Horario()
        {
            var credenciales = new LoginDTO
            {
                NumControl = "201G0256",
                Password = "ESCOLARES"
            };

            var horario = await apiService.GetHorario(credenciales);

            if (horario == null || !horario.Any())
                return BadRequest("No se encontro el horario del alumno.");


            Dictionary<string, List<MateriaHorarioDTO>> horarioDic = MethodsStatic.CrearDiccionarioMateria(horario);


            return Ok(horarioDic);
        }

    }
}
