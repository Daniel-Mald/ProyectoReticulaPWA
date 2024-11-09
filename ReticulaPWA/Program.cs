using ReticulaPWA.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorPages();
builder.Services.AddHttpClient();
builder.Services.AddMvc();
builder.Services.AddConnections();
builder.Services.AddControllers();
builder.Services.AddSingleton<ApiService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder => builder.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod());
});
var app = builder.Build();
app.UseCors("AllowSpecificOrigin");
app.MapRazorPages();
app.MapControllers();
app.UseStaticFiles();

app.Run();
