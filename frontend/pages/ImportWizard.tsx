import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

type Step = 'upload' | 'mapping' | 'preview' | 'import' | 'complete';

interface CSVData {
  headers: string[];
  rows: string[][];
}

const fieldOptions = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'company', label: 'Company' },
];

export function ImportWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'merge' | 'create'>('skip');
  const [importProgress, setImportProgress] = useState(0);
  const [importJobId, setImportJobId] = useState<number | null>(null);
  const { toast } = useToast();

  const createImportMutation = useMutation({
    mutationFn: async (data: {
      filename: string;
      fieldMapping: Record<string, string>;
      duplicateHandling: 'skip' | 'merge' | 'create';
      csvData: string[][];
    }) => {
      return await backend.imports.createImport({
        companyId: 1, // Demo company
        userId: 1, // Demo user
        ...data,
      });
    },
    onSuccess: (data) => {
      setImportJobId(data.id);
      setCurrentStep('import');
      pollImportStatus(data.id);
    },
    onError: (error) => {
      console.error('Failed to create import:', error);
      toast({
        title: "Error",
        description: "Failed to start import. Please try again.",
        variant: "destructive",
      });
    },
  });

  const pollImportStatus = async (jobId: number) => {
    const checkStatus = async () => {
      try {
        const status = await backend.imports.getImportStatus({ id: jobId });
        setImportProgress(status.progress);
        
        if (status.status === 'completed') {
          setCurrentStep('complete');
          toast({
            title: "Success",
            description: `Import completed! ${status.successRows} contacts imported successfully.`,
          });
        } else if (status.status === 'failed') {
          toast({
            title: "Error",
            description: "Import failed. Please try again.",
            variant: "destructive",
          });
        } else {
          setTimeout(checkStatus, 1000);
        }
      } catch (error) {
        console.error('Failed to check import status:', error);
      }
    };
    
    checkStatus();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Error",
          description: "CSV file must contain at least a header row and one data row.",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      setCsvData({ headers, rows });
      setCurrentStep('mapping');
    };

    reader.readAsText(file);
  };

  const handleMappingComplete = () => {
    const requiredMappings = Object.values(fieldMapping).filter(Boolean);
    if (requiredMappings.length === 0) {
      toast({
        title: "Error",
        description: "Please map at least one field.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep('preview');
  };

  const handleImportStart = () => {
    if (!csvData) return;

    createImportMutation.mutate({
      filename: 'imported-contacts.csv',
      fieldMapping,
      duplicateHandling,
      csvData: csvData.rows,
    });
  };

  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload CSV File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Choose a CSV file to upload
          </h3>
          <p className="text-gray-600 mb-4">
            File should contain contact information with headers in the first row.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Label htmlFor="csv-upload">
            <Button asChild>
              <span>Select CSV File</span>
            </Button>
          </Label>
        </div>
        
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Supported fields:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>First Name, Last Name</li>
            <li>Email Address</li>
            <li>Phone Number</li>
            <li>Job Title</li>
            <li>Company Name</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderMappingStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Map CSV Fields</CardTitle>
        <p className="text-gray-600">
          Match your CSV columns to contact fields
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {csvData?.headers.map((header, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-1/3">
              <Label className="font-medium">{header}</Label>
            </div>
            <div className="w-2/3">
              <Select
                value={fieldMapping[index] || ''}
                onValueChange={(value) => setFieldMapping({ ...fieldMapping, [index]: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Don't import</SelectItem>
                  {fieldOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <Button onClick={handleMappingComplete}>
            Continue to Preview
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preview Import</CardTitle>
          <p className="text-gray-600">
            Review the first 10 rows and choose how to handle duplicates
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  {Object.values(fieldMapping).filter(Boolean).map((field, index) => (
                    <th key={index} className="border border-gray-300 p-2 text-left font-medium">
                      {fieldOptions.find(opt => opt.value === field)?.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData?.rows.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {Object.entries(fieldMapping).filter(([_, field]) => field).map(([colIndex, _], cellIndex) => (
                      <td key={cellIndex} className="border border-gray-300 p-2">
                        {row[parseInt(colIndex)] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duplicate Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={duplicateHandling} onValueChange={(value: any) => setDuplicateHandling(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skip" id="skip" />
              <Label htmlFor="skip">Skip duplicates (based on email)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="merge" id="merge" />
              <Label htmlFor="merge">Update existing contacts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="create" id="create" />
              <Label htmlFor="create">Create duplicates</Label>
            </div>
          </RadioGroup>
          
          <div className="pt-4">
            <Button onClick={handleImportStart} disabled={createImportMutation.isPending}>
              {createImportMutation.isPending ? 'Starting Import...' : 'Start Import'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderImportStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importing Contacts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{importProgress}%</span>
          </div>
          <Progress value={importProgress} className="w-full" />
        </div>
        <p className="text-gray-600">
          Please wait while we import your contacts. This may take a few moments.
        </p>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Import Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Contacts imported successfully!
          </h3>
          <p className="text-gray-600">
            Your contacts have been added to your CRM and are ready to use.
          </p>
        </div>
        
        <div className="flex gap-2 justify-center">
          <Button onClick={() => setCurrentStep('upload')}>
            Import More
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/contacts'}>
            View Contacts
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const steps = [
    { key: 'upload', label: 'Upload', completed: ['mapping', 'preview', 'import', 'complete'].includes(currentStep) },
    { key: 'mapping', label: 'Map Fields', completed: ['preview', 'import', 'complete'].includes(currentStep) },
    { key: 'preview', label: 'Preview', completed: ['import', 'complete'].includes(currentStep) },
    { key: 'import', label: 'Import', completed: currentStep === 'complete' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Contacts</h1>
        <p className="text-gray-600">Import contacts from a CSV file</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.completed 
                    ? 'bg-green-600 text-white' 
                    : currentStep === step.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-1">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step.completed ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'mapping' && renderMappingStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      {currentStep === 'import' && renderImportStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
}
