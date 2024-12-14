using ReticulaPWA.Models.DTOs;
using System.Text.RegularExpressions;

namespace ReticulaPWA.Helpers
{
    public static class ToValues
    {
        public static int ObtenerSemestreActual(InformacionGeneral informacionGeneral)
        {
            Match match2 = Regex.Match(informacionGeneral.Informacion!.FirstOrDefault(x => x.dato == "PERIODO ACTUAL O ULTIMO:")!.valor, @"^\((\d+)\)");


            if (match2.Success)
            {
                return int.Parse(match2.Groups[1].Value);
            }

            return 0;
        }


    }
}
