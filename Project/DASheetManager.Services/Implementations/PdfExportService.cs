using DASheetManager.Services.DTOs;
using DASheetManager.Services.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DASheetManager.Services.Implementations;

public class PdfExportService : IPdfExportService
{
    private readonly IDASheetService _sheetService;
    private readonly IVendorEvaluationService _evalService;

    public PdfExportService(IDASheetService sheetService, IVendorEvaluationService evalService)
    {
        _sheetService = sheetService;
        _evalService = evalService;
    }

    public async Task<byte[]> GeneratePdfAsync(int sheetId, int userId)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var sheet = await _sheetService.GetByIdAsync(sheetId, userId);
        if (sheet == null) throw new KeyNotFoundException($"Sheet {sheetId} not found.");

        var scores = await _evalService.CalculateScoresAsync(sheetId);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(8));

                // Header
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text(sheet.Name).Bold().FontSize(14);
                        col.Item().Text($"DA Type: {sheet.DaType}").FontSize(9);
                    });
                    row.RelativeItem().AlignRight().Column(col =>
                    {
                        col.Item().Text($"Created By: {sheet.CreatedByName}").FontSize(9);
                        col.Item().Text($"Date: {sheet.CreatedAt:dd-MMM-yyyy}").FontSize(9);
                        col.Item().Text($"Status: {sheet.Status}").FontSize(9);
                    });
                });

                // Content
                page.Content().PaddingVertical(10).Column(content =>
                {
                    if (!scores.Any() || !sheet.Categories.Any()) return;

                    foreach (var category in sheet.Categories)
                    {
                        content.Item().PaddingBottom(8).Column(catCol =>
                        {
                            catCol.Item().Background("#4F46E5").Padding(4)
                                .Text($"  {category.Name}").FontColor("#FFFFFF").Bold().FontSize(9);

                            catCol.Item().Table(table =>
                            {
                                // Define columns: Param Name | Weightage | (Score | Result) per vendor
                                table.ColumnsDefinition(cols =>
                                {
                                    cols.RelativeColumn(3); // Param name
                                    cols.RelativeColumn(1); // Weightage
                                    foreach (var _ in scores)
                                    {
                                        cols.RelativeColumn(1); // Score
                                        cols.RelativeColumn(1); // Result
                                    }
                                });

                                // Header row
                                table.Header(header =>
                                {
                                    header.Cell().Border(0.5f).Padding(3).Text("Judgement Parameter").Bold();
                                    header.Cell().Border(0.5f).Padding(3).Text("Wt%").Bold();
                                    foreach (var vendor in scores)
                                    {
                                        header.Cell().ColumnSpan(2).Border(0.5f).Padding(3)
                                            .Text(vendor.VendorName + (vendor.IsWinner ? " ★" : "")).Bold();
                                    }

                                    // Sub-header for Score/Result
                                    header.Cell().Border(0.5f).Padding(2).Text("");
                                    header.Cell().Border(0.5f).Padding(2).Text("");
                                    foreach (var _ in scores)
                                    {
                                        header.Cell().Border(0.5f).Padding(2).Text("Score").FontSize(7);
                                        header.Cell().Border(0.5f).Padding(2).Text("Result").FontSize(7);
                                    }
                                });

                                // Param rows
                                foreach (var param in category.Parameters)
                                {
                                    table.Cell().Border(0.5f).Padding(3).Text(param.Name);
                                    table.Cell().Border(0.5f).Padding(3).AlignCenter().Text($"{param.Weightage}%");

                                    foreach (var vendor in scores)
                                    {
                                        var catScore = vendor.CategoryScores.FirstOrDefault(c => c.SheetCategoryId == category.SheetCategoryId);
                                        var paramScore = catScore?.ParamScores.FirstOrDefault(p => p.SheetParamId == param.SheetParamId);

                                        table.Cell().Border(0.5f).Padding(3).AlignCenter()
                                            .Text(paramScore?.EvalScore?.ToString() ?? "-");
                                        table.Cell().Border(0.5f).Padding(3).AlignCenter()
                                            .Text(paramScore?.Result.ToString("F0") ?? "-");
                                    }
                                }

                                // Subtotal row
                                table.Cell().ColumnSpan(2).Border(0.5f).Padding(3).Background("#F3F4F6")
                                    .Text("Sub Total").Bold();
                                foreach (var vendor in scores)
                                {
                                    var catScore = vendor.CategoryScores.FirstOrDefault(c => c.SheetCategoryId == category.SheetCategoryId);
                                    table.Cell().ColumnSpan(2).Border(0.5f).Padding(3).Background("#F3F4F6")
                                        .AlignCenter().Text(catScore?.SubTotal.ToString("F0") ?? "0").Bold();
                                }
                            });
                        });
                    }

                    // Overall Scores
                    content.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(2);
                            foreach (var _ in scores)
                                cols.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Border(0.5f).Padding(4).Background("#4F46E5")
                                .Text("Overall Scores").FontColor("#FFFFFF").Bold().FontSize(10);
                            foreach (var vendor in scores)
                            {
                                header.Cell().Border(0.5f).Padding(4).Background(vendor.IsWinner ? "#FEF3C7" : "#F3F4F6")
                                    .AlignCenter()
                                    .Text($"{vendor.VendorName}: {vendor.OverallScore:F0}" + (vendor.IsWinner ? " ★ WINNER" : ""))
                                    .Bold().FontSize(10);
                            }
                        });
                    });
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("DA Sheet Manager | Generated on ");
                    text.Span(DateTime.Now.ToString("dd-MMM-yyyy HH:mm"));
                });
            });
        });

        return document.GeneratePdf();
    }
}
