import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import type { ExtractionResult } from "@shared/schema";

export default function AnalyticsPage() {
  const [selectedExtraction, setSelectedExtraction] = useState<string>("");

  const { data: extractions, isLoading: extractionsLoading } = useQuery<ExtractionResult[]>({
    queryKey: ["/api/extractions"],
  });

  const { data: selectedData, isLoading: dataLoading } = useQuery<ExtractionResult>({
    queryKey: [`/api/extractions/${selectedExtraction}`],
    enabled: !!selectedExtraction,
  });

  const completedExtractions = extractions?.filter(e => e.status === "completed" && e.analyticsData) || [];
  const analytics = selectedData?.analyticsData;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-analytics-title">Analytics</h1>
        <p className="text-muted-foreground">
          Advanced visualizations and insights from extracted data
        </p>
      </div>

      {/* Extraction Selector */}
      <div className="max-w-md">
        <label className="text-sm font-medium mb-2 block">Select Extraction</label>
        <Select value={selectedExtraction} onValueChange={setSelectedExtraction}>
          <SelectTrigger data-testid="select-extraction-analytics">
            <SelectValue placeholder="Choose a completed extraction" />
          </SelectTrigger>
          <SelectContent>
            {extractionsLoading ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
            ) : completedExtractions.length === 0 ? (
              <SelectItem value="none" disabled>No completed extractions with analytics</SelectItem>
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

      {!selectedExtraction ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Select an extraction to view analytics</p>
          </CardContent>
        </Card>
      ) : dataLoading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Summary Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Visits</CardTitle>
                <CardDescription>Number of visit columns detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary" data-testid="text-total-visits">
                  {analytics.totalVisits}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Assessments</CardTitle>
                <CardDescription>Number of assessment procedures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary" data-testid="text-total-assessments">
                  {analytics.totalAssessments}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visit Frequency Chart */}
          {analytics.visitFrequency && analytics.visitFrequency.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Visit Frequency Analysis</CardTitle>
                <CardDescription>Number of assessments per visit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.visitFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="visit" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Assessments" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Period Analysis */}
          {analytics.periodAnalysis && analytics.periodAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Period Analysis</CardTitle>
                <CardDescription>Visits grouped by study period</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Period</TableHead>
                      <TableHead className="font-semibold">Visits</TableHead>
                      <TableHead className="font-semibold text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.periodAnalysis.map((period, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{period.period}</TableCell>
                        <TableCell>{period.visits.join(", ")}</TableCell>
                        <TableCell className="text-right">{period.visits.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Assessments by Visit Details */}
          {analytics.assessmentsByVisit && analytics.assessmentsByVisit.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assessments by Visit</CardTitle>
                <CardDescription>Detailed breakdown of procedures per visit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {analytics.assessmentsByVisit.map((visit, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{visit.visit}</h4>
                        <span className="text-sm text-muted-foreground">{visit.count} assessments</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visit.assessments.slice(0, 10).map((assessment, aIdx) => (
                          <span key={aIdx} className="text-xs px-2 py-1 bg-muted rounded">
                            {assessment}
                          </span>
                        ))}
                        {visit.assessments.length > 10 && (
                          <span className="text-xs px-2 py-1 text-muted-foreground">
                            +{visit.assessments.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meaning Overrides */}
          {analytics.meaningOverrides && analytics.meaningOverrides.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Annotation Reference</CardTitle>
                <CardDescription>Key definitions and annotations from the document</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 font-semibold">Key</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.meaningOverrides.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono font-semibold">{item.key}</TableCell>
                        <TableCell className="text-sm">{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No analytics data available for this extraction</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
