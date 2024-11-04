using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ReticulaPWA.Models.DTOs;
using System.Globalization;

namespace ReticulaPWA.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReticulaController : ControllerBase
    {
        public ReticulaController()
        {
        }
        [HttpPost]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            if (dto == null) { return BadRequest(); }
            if (string.IsNullOrWhiteSpace(dto.NumeroControl)) 
            { ModelState.AddModelError("", "El número de control no puede estar vacio"); }
            if(string.IsNullOrWhiteSpace(dto.Password))
            { ModelState.AddModelError("", "La contraseña no puede estar vacia"); }
            if(ModelState.IsValid)
            {

                //hacer las peticiones
                List<Task> tasks = new()
                {

                };
                await Task.WhenAll();
                




                //crear dto de regreso
                return Ok();
            }
            else
            {
                return BadRequest(ModelState);
            }




            
        }
    }
}
