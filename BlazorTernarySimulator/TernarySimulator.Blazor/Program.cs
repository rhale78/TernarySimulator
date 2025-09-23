using TernarySimulator.Blazor.Components;
using TernarySimulator.Blazor.Core;

// Run core tests first to verify C# implementation
Console.WriteLine("Running C# Ternary Simulator Tests...\n");
CoreTests.RunAllTests();
Console.WriteLine("\nStarting Blazor web server...\n");

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Register our simulator as a singleton service
builder.Services.AddSingleton<TernarySimulator.Blazor.Core.TernarySimulatorCore>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
