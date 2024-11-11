using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
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


        //[HttpGet]
        //public IActionResult Get()
        //{

        //    var materia = new MateriasDTO
        //    {
        //        carrera = "ddd"
        //    };


        //    return Ok(JsonSerializer.Serialize(materia));
        //}

        [HttpGet]
        public async Task<IActionResult> Login()
        {
            //if (dto == null) { return BadRequest(); }
            string NumeroControl = "";
            string Password = "";
            if (Request.Headers.TryGetValue("NumeroControl", out StringValues authHeader))
            {
                NumeroControl = authHeader.ToString();
            }
            if (Request.Headers.TryGetValue("Password", out StringValues authHeader2))
            {
                Password = authHeader2.ToString();
            }
            if (string.IsNullOrWhiteSpace(NumeroControl))
            { ModelState.AddModelError("", "El número de control no puede estar vacio"); }
            if (string.IsNullOrWhiteSpace(Password))
            { ModelState.AddModelError("", "La contraseña no puede estar vacia"); }
            if (ModelState.IsValid)
            {
                CredencialesModel Credenciales = new()
                {
                    Password = Password,
                    NumeroControl = NumeroControl
                };
                bool a = await apiService.FokinLogin(Credenciales);
                if(a == false) { return BadRequest("Credenciales incorrectas"); }

                var informacionGeneral = await apiService.GetInformacionGeneral(Credenciales);
                if (informacionGeneral == null) { return BadRequest(); }
                if (informacionGeneral.CredencialesIncorrectas == true) { return BadRequest("Credenciales incorrectas"); }
                else if (informacionGeneral.Problemas == true) { return BadRequest("Ha ocurrido un problema"); }
                else
                {
                    string plan = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PLAN DE ESTUDIOS:")!.valor;
                    var kardexTask = apiService.GetKardex(Credenciales);
                    var horarioTask = apiService.GetHorario(Credenciales);
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

                        if (kardexTask.Result == null ||
                            materiasPlanTask.Result == null ||
                            horarioTask.Result == null)
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
                        List<MateriaReticula> materiasFromPlan = resultado.Materias.Select(x => new MateriaReticula
                        {
                            Clave = x.clave.Replace("-", ""),
                            Nombre = x.nombre,
                            Semestre = x.semestre

                        }).ToList();
                        List<MateriaReticula> materiasFromKardex = resultado.Kardex.Select(x => new MateriaReticula
                        {
                            Clave = x.clave,
                            Nombre = x.materia
                            ,
                            Oportunidad = x.oportunidad

                        }).ToList();

                        foreach (var item in materiasFromKardex)
                        {
                            var matInKardex = resultado.Kardex.LastOrDefault(x => x.clave == item.Clave) as KardexDTO;
                            int semesstre = 0;
                            var propiedadesSemestre = typeof(KardexDTO).GetProperties()
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
                            }
                        }
                        foreach (var item in materiasFromPlan)
                        {
                            if (materiasFromKardex.FirstOrDefault(x => x.Clave == item.Clave) == null
                                && materiasFromKardex.FirstOrDefault(x => x.Nombre == item.Nombre) == null)
                            {
                                MateriaReticula m = new()
                                {
                                    Nombre = item.Nombre,
                                    Clave = item.Clave,
                                    Semestre = item.Semestre
                                };
                                if (resultado.Horario.FirstOrDefault(x => x.clave.Split(" ")[0] == item.Clave) != null ||
                                    resultado.Horario.FirstOrDefault(x => x.nombre == item.Nombre) != null)
                                {
                                    m.Estado = "Cursando";
                                    var sem = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PERIODO ACTUAL O ULTIMO:")!.valor.Substring(1, 2);
                                    m.Semestre = int.Parse(sem);
                                }
                                else
                                {
                                    m.Estado = "Sin cursar";
                                }
                                materiasFromKardex.Add(m);
                            }
                        }
                       
                        List<Semestre> semestres = new List<Semestre>();
                        int semestreActual = 0;
                        Match match2 = Regex.Match(informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PERIODO ACTUAL O ULTIMO:")!.valor, @"^\((\d+)\)");

                        if (match2.Success)
                        {
                            semestreActual = int.Parse(match2.Groups[1].Value);
                        }
                        
                        for (int i = 0; i < semestreActual; i++)
                        {
                            int s = i + 1;
                            Semestre newSemestre = new();
                            newSemestre.Numero = s;

                            newSemestre.Materias = materiasFromKardex.Where(x => x.Semestre == s && !x.Clave.StartsWith("TUT") && x.Clave != "ACA0001" && !x.Clave.StartsWith("ING"));
                            semestres.Add(newSemestre);

                        }
                        //quitar las repetidas



                        //acomodar las materias en sus lugares correspondientes
                        //

                        //crear dto a regresar
                        Match match = Regex.Match(informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PLAN DE ESTUDIOS:")!.valor, @"\bDE\s+(\d+)\b");
                        int creditos = 0;

                        string especialidad = informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "M&OACUTE;DULO DE ESPECIALIDAD:")!.valor;
                        if (match.Success)
                        {
                            creditos = int.Parse(match.Groups[1].Value);
                        }
                        
                        RespuestaDTO respuestaDTO = new()
                        {
                            Semestres = semestres,

                            InformacionGeneral = new()
                            {
                                
                                NombreDelAlumno = informacionGeneral.Informacion!.FirstOrDefault(x=>x.dato == "NOMBRE DEL ALUMNO:")!.valor,
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
                                //TotalSemestres =
                            }


                        };

                        return Ok(respuestaDTO);
                    }
                    catch (Exception ex)
                    {
                        return BadRequest($"Error en las peticiones: {ex.Message}");
                    }
                }
            }
            else
            {
                return BadRequest(ModelState);
            }
        }
    }
}
