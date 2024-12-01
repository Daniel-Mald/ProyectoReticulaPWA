using System.Globalization;

namespace ReticulaPWA.Helpers
{
    public static class StringExtends
    {
        public static string ToHora(this string input)
        {
            string hora = input.Split(' ')[0];
            string[] parts = hora.Split("-");

            DateTime startTime = DateTime.ParseExact(parts[0], "HH:mm", CultureInfo.InvariantCulture);
            DateTime endTime = DateTime.ParseExact(parts[1], "HH:mm", CultureInfo.InvariantCulture);

            string formattedStartTime = startTime.ToString("h:mm tt", CultureInfo.InvariantCulture).ToLower();
            string formattedEndTime = endTime.ToString("h:mm tt", CultureInfo.InvariantCulture).ToLower();

            return $"{formattedStartTime} - {formattedEndTime}";
        }

        public static string ToSalon(this string input) => input.Split(' ')[1];

    }
}
