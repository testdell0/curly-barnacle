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

                page.Header().PaddingBottom(8).Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text(sheet.Name).Bold().FontSize(14);
                        col.Item().Text($"Template: {sheet.SourceTemplateName}")
                            .FontSize(9).FontColor("#2563EB");
                    });
                    row.RelativeItem().AlignRight().Column(col =>
                    {
                        col.Item().Text($"Created By: {sheet.CreatedByName}").FontSize(9);
                        col.Item().Text($"Created: {sheet.CreatedAt:dd-MMM-yyyy}").FontSize(9);
                    });
                });

                page.Content().PaddingVertical(4).Column(content =>
                {
                    if (!sheet.Categories.Any()) return;

                    content.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(55);   // Model Item
                            cols.RelativeColumn(3);    // Judgement Parameter
                            cols.ConstantColumn(25);   // Weight
                            foreach (var _ in scores)
                            {
                                cols.RelativeColumn(4);   // Comment
                                cols.ConstantColumn(20);  // Eval
                                cols.ConstantColumn(28);  // Result
                            }
                        });

                        table.Header(header =>
                        {
                            // Row 1 — first 3 columns span both rows; vendor names span 3 sub-cols each
                            header.Cell().RowSpan(2).Border(0.5f).Padding(3).Background("#E8EAED")
                                .AlignCenter().AlignMiddle().Text("Model Item").Bold().FontSize(7);
                            header.Cell().RowSpan(2).Border(0.5f).Padding(3).Background("#E8EAED")
                                .AlignMiddle().Text("Judgement Parameter").Bold().FontSize(7);
                            header.Cell().RowSpan(2).Border(0.5f).Padding(3).Background("#E8EAED")
                                .AlignCenter().AlignMiddle().Text("Weight").Bold().FontSize(7);
                            foreach (var vendor in scores)
                            {
                                var bg = vendor.IsWinner ? "#FEF3C7" : "#E8EAED";
                                var label = vendor.VendorName + (vendor.IsWinner ? " ★" : "");
                                header.Cell().ColumnSpan(3).Border(0.5f).Padding(3).Background(bg)
                                    .AlignCenter().Text(label).Bold().FontSize(7);
                            }

                            // Row 2 — Comment / Eval / Result sub-headers per vendor
                            foreach (var _ in scores)
                            {
                                header.Cell().Border(0.5f).Padding(2).Background("#E8EAED")
                                    .AlignCenter().Text("Comment").Italic().FontSize(6);
                                header.Cell().Border(0.5f).Padding(2).Background("#E8EAED")
                                    .AlignCenter().Text("Eval").Italic().FontSize(6);
                                header.Cell().Border(0.5f).Padding(2).Background("#E8EAED")
                                    .AlignCenter().Text("Result").Italic().FontSize(6);
                            }
                        });

                        // Body — one unified table for all categories
                        foreach (var category in sheet.Categories)
                        {
                            var parameters = category.Parameters.ToList();
                            var paramCount = parameters.Count;
                            var isFirst = true;

                            foreach (var param in parameters)
                            {
                                if (isFirst)
                                {
                                    // Category cell spans all param rows + the sub-total row
                                    table.Cell().RowSpan(paramCount + 1)
                                        .Border(0.5f).Padding(3).Background("#DBEAFE")
                                        .AlignCenter().AlignMiddle()
                                        .Text(category.Name).Bold().FontSize(7);
                                    isFirst = false;
                                }

                                table.Cell().Border(0.5f).Padding(3)
                                    .Text(param.Name).FontSize(7);
                                table.Cell().Border(0.5f).Padding(3).AlignCenter()
                                    .Text($"{param.Weightage}%").FontSize(7);

                                foreach (var vendor in scores)
                                {
                                    var catScore = vendor.CategoryScores
                                        .FirstOrDefault(c => c.SheetCategoryId == category.SheetCategoryId);
                                    var ps = catScore?.ParamScores
                                        .FirstOrDefault(p => p.SheetParamId == param.SheetParamId);

                                    table.Cell().Border(0.5f).Padding(2)
                                        .Text(ps?.VendorComment ?? "").FontSize(6);
                                    table.Cell().Border(0.5f).Padding(3).AlignCenter()
                                        .Text(ps?.EvalScore?.ToString() ?? "-").FontSize(7);
                                    table.Cell().Border(0.5f).Padding(3).AlignCenter()
                                        .Text(ps?.Result > 0 ? ps.Result.ToString("F0") : "-").FontSize(7);
                                }
                            }

                            // Sub-total row — first column still covered by RowSpan
                            table.Cell().ColumnSpan(2).Border(0.5f).Padding(3).Background("#F3F4F6")
                                .AlignRight().Text("Sub-total").Bold().FontSize(7);
                            foreach (var vendor in scores)
                            {
                                var catScore = vendor.CategoryScores
                                    .FirstOrDefault(c => c.SheetCategoryId == category.SheetCategoryId);
                                table.Cell().Border(0.5f).Background("#F3F4F6").Text("").FontSize(7);
                                table.Cell().Border(0.5f).Background("#F3F4F6").Text("").FontSize(7);
                                table.Cell().Border(0.5f).Padding(3).Background("#F3F4F6").AlignCenter()
                                    .Text(catScore?.SubTotal.ToString("F0") ?? "0").Bold().FontSize(7);
                            }
                        }

                        // Grand Total row
                        table.Cell().ColumnSpan(3).Border(0.5f).Padding(4).Background("#1E3A5F")
                            .AlignCenter().Text("Grand Total").Bold().FontSize(8).FontColor("#FFFFFF");
                        foreach (var vendor in scores)
                        {
                            var highlight = vendor.IsWinner ? "#FEF3C7" : "#EFF6FF";
                            table.Cell().Border(0.5f).Background("#EFF6FF").Text("").FontSize(7);
                            table.Cell().Border(0.5f).Background("#EFF6FF").Text("").FontSize(7);
                            table.Cell().Border(0.5f).Padding(4).Background(highlight).AlignCenter()
                                .Text(vendor.OverallScore.ToString("F0") + (vendor.IsWinner ? " ★" : ""))
                                .Bold().FontSize(8);
                        }
                    });
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("DA Sheet Manager  |  Generated: ");
                    text.Span(DateTime.Now.ToString("dd-MMM-yyyy HH:mm"));
                    text.Span("  |  Page ");
                    text.CurrentPageNumber();
                    text.Span(" of ");
                    text.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }
}
