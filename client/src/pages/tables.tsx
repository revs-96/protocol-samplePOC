import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { useState } from "react";
import type { ExtractionResult } from "@shared/schema";

export default function TablesPage() {
  const [selectedExtraction, setSelectedExtraction] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: extractions, isLoading: extractionsLoading } = useQuery<ExtractionResult[]>({
    queryKey: ["/api/extractions"],
  });

  const { data: selectedData, isLoading: dataLoading } = useQuery<ExtractionResult>({
    queryKey: [`/api/extractions/${selectedExtraction}`],
    enabled: !!selectedExtraction,
  });

  const completedExtractions = extractions?.filter(e => e.status === "completed") || [];

  // Filter table rows based on search
  const filteredRows = selectedData?.extractedData?.rows?.filter(row => {
    if (!searchQuery) return true;
    return row.some(cell => 
      String(cell).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-tables-title">Extracted Tables</h1>
        <p className="text-muted-foreground">
          View and search extracted table data from your PDFs
        </p>
      </div>

      {/* Extraction Selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Extraction</label>
          <Select value={selectedExtraction} onValueChange={setSelectedExtraction}>
            <SelectTrigger data-testid="select-extraction">
              <SelectValue placeholder="Choose a completed extraction" />
            </SelectTrigger>
            <SelectContent>
              {extractionsLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : completedExtractions.length === 0 ? (
                <SelectItem value="none" disabled>No completed extractions</SelectItem>
              ) : (
                completedExtractions.map(extraction => (
                  <SelectItem key={extraction.id} value={extraction.id}>
                    {extraction.filename} ({new Date(extraction.uploadedAt).toLocaleDateString()})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedExtraction && (
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Search Table</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-table"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table Display */}
      {!selectedExtraction ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Select an extraction to view table data</p>
          </CardContent>
        </Card>
      ) : dataLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : selectedData?.extractedData ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{selectedData.filename}</CardTitle>
              <CardDescription>
                {selectedData.extractedData.metadata?.totalRows} rows × {selectedData.extractedData.metadata?.totalColumns} columns
                {searchQuery && ` • Showing ${filteredRows.length} of ${selectedData.extractedData.rows.length} rows`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" data-testid="button-export-table">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    {selectedData.extractedData.headers.map((header, idx) => (
                      <TableHead key={idx} className="font-semibold whitespace-nowrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedData.extractedData.headers.length} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No results found" : "No data available"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row, rowIdx) => (
                      <TableRow key={rowIdx} className="hover:bg-muted/50">
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx} className="whitespace-nowrap">
                            {String(cell)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No table data available for this extraction</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
