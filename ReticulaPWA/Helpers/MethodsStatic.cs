using ReticulaPWA.Models.DTOs;
using System.Globalization;
using System.Security.Cryptography;

namespace ReticulaPWA.Helpers
{
    public static class MethodsStatic
    {

        public static Dictionary<string, List<MateriaHorarioDTO>> CrearDiccionarioMateria(IEnumerable<HorarioDTO> horario)
        {
            Dictionary<string, List<MateriaHorarioDTO>> diccionario = [];

            var propiedades = typeof(HorarioDTO).GetProperties();

            foreach (var materia in horario)
            {
                foreach (var propiedad in propiedades)
                {
                    string dia = propiedad.Name;
                    string valor = materia.ToValorMateria(dia);

                    if (string.IsNullOrWhiteSpace(valor))
                        continue;


                    if (!diccionario.ContainsKey(dia))
                        diccionario[dia] = [];

                    diccionario[dia].Add(new MateriaHorarioDTO
                    {
                        Nombre = materia.nombre,
                        Docente = materia.docente,
                        Hora = valor.ToHora(),
                        Salon = valor.ToSalon()
                    });
                }
            }

            foreach (var kvp in diccionario)
            {
                diccionario[kvp.Key] = kvp.Value
                    .OrderBy(hora =>
                    {
                        string horaInicio = hora.Hora.Split(" - ")[0];
                        return DateTime.ParseExact(horaInicio, "h:mm tt", CultureInfo.InvariantCulture);
                    })
                    .ToList();
            }

            return diccionario;
        }
        public static string ToValorMateria(this HorarioDTO materia, string dia)
        {
            if (string.IsNullOrWhiteSpace(dia))
                return string.Empty;

            if (materia == null)
                return string.Empty;

            return dia switch
            {
                "lunes" => materia.lunes,
                "martes" => materia.martes,
                "miercoles" => materia.miercoles,
                "jueves" => materia.jueves,
                "viernes" => materia.viernes,
                "sabado" => materia.sabado,
                _ => string.Empty,
            };
        }

    }
}
