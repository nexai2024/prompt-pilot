'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Code,
  Save,
  Play,
  Plus,
  Trash2,
  Copy,
  Settings,
  Key,
  Shield,
  Zap,
  Database,
  ArrowRight,
  ArrowDown,
  Globe,
  Clock,
  AlertCircle
} from 'lucide-react';

interface EndpointField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface APIEndpoint {
  id: string;
  method: string;
  path: string;
  name: string;
  description: string;
  requestFields: EndpointField[];
  responseFields: EndpointField[];
  promptId: string;
  authentication: string;
  rateLimit: number;
}

export default function APIDesigner() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([
    {
      id: '1',
      method: 'POST',
      path: '/api/generate-content',
      name: 'Content Generator',
      description: 'Generate engaging content from topics',
      requestFields: [
        { name: 'topic', type: 'string', required: true, description: 'Content topic' },
        { name: 'tone', type: 'string', required: false, description: 'Content tone' }
      ],
      responseFields: [
        { name: 'content', type: 'string', required: true, description: 'Generated content' },
        { name: 'wordCount', type: 'number', required: true, description: 'Word count' }
      ],
      promptId: 'content-generator-v1',
      authentication: 'api-key',
      rateLimit: 100
    }
  ]);

  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('1');
  const [activeTab, setActiveTab] = useState('design');
  const [testRequest, setTestRequest] = useState('');
  const [testResponse, setTestResponse] = useState('');

  const availablePrompts = [
    { id: 'content-generator-v1', name: 'Content Generator v1.0' },
    { id: 'sentiment-analyzer-v2', name: 'Sentiment Analyzer v2.1' },
    { id: 'code-reviewer-v1', name: 'Code Reviewer v1.0' },
    { id: 'email-assistant-v1', name: 'Email Assistant v1.0' }
  ];

  const fieldTypes = [
    'string', 'number', 'boolean', 'array', 'object', 'date', 'email', 'url'
  ];

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const getCurrentEndpoint = () => {
    return endpoints.find(ep => ep.id === selectedEndpoint) || endpoints[0];
  };

  const updateEndpoint = (field: string, value: any) => {
    setEndpoints(endpoints.map(ep => 
      ep.id === selectedEndpoint 
        ? { ...ep, [field]: value }
        : ep
    ));
  };

  const addRequestField = () => {
    const endpoint = getCurrentEndpoint();
    updateEndpoint('requestFields', [
      ...endpoint.requestFields,
      { name: '', type: 'string', required: false, description: '' }
    ]);
  };

  const addResponseField = () => {
    const endpoint = getCurrentEndpoint();
    updateEndpoint('responseFields', [
      ...endpoint.responseFields,
      { name: '', type: 'string', required: true, description: '' }
    ]);
  };

  const updateRequestField = (index: number, field: string, value: any) => {
    const endpoint = getCurrentEndpoint();
    const updated = [...endpoint.requestFields];
    updated[index] = { ...updated[index], [field]: value };
    updateEndpoint('requestFields', updated);
  };

  const updateResponseField = (index: number, field: string, value: any) => {
    const endpoint = getCurrentEndpoint();
    const updated = [...endpoint.responseFields];
    updated[index] = { ...updated[index], [field]: value };
    updateEndpoint('responseFields', updated);
  };

  const removeRequestField = (index: number) => {
    const endpoint = getCurrentEndpoint();
    updateEndpoint('requestFields', endpoint.requestFields.filter((_, i) => i !== index));
  };

  const removeResponseField = (index: number) => {
    const endpoint = getCurrentEndpoint();
    updateEndpoint('responseFields', endpoint.responseFields.filter((_, i) => i !== index));
  };

  const addNewEndpoint = () => {
    const newEndpoint: APIEndpoint = {
      id: Date.now().toString(),
      method: 'POST',
      path: '/api/new-endpoint',
      name: 'New Endpoint',
      description: 'Description for new endpoint',
      requestFields: [],
      responseFields: [],
      promptId: '',
      authentication: 'api-key',
      rateLimit: 100
    };
    setEndpoints([...endpoints, newEndpoint]);
    setSelectedEndpoint(newEndpoint.id);
  };

  const testEndpoint = () => {
    // Simulate API test
    const endpoint = getCurrentEndpoint();
    const mockResponse = {
      success: true,
      data: endpoint.responseFields.reduce((acc, field) => {
        acc[field.name] = field.type === 'string' ? 'Sample response' : 
                          field.type === 'number' ? 42 : 
                          field.type === 'boolean' ? true : 'Sample value';
        return acc;
      }, {} as any),
      metadata: {
        executionTime: '245ms',
        tokensUsed: 150,
        model: 'gpt-4'
      }
    };
    setTestResponse(JSON.stringify(mockResponse, null, 2));
  };

  const endpoint = getCurrentEndpoint();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Code className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">API Designer</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Export Schema
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <Save className="w-4 h-4 mr-2" />
                Save API
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" asChild>
                <Link href="/deployments">
                  <Zap className="w-4 h-4 mr-2" />
                  Deploy
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Endpoints List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  API Endpoints
                  <Button size="sm" variant="outline" onClick={addNewEndpoint}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEndpoint === ep.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedEndpoint(ep.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={ep.method === 'POST' ? 'default' : 'secondary'}>
                        {ep.method}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">Active</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm text-gray-900">{ep.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{ep.path}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">API Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Endpoints</span>
                  <span className="font-medium">{endpoints.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Endpoints</span>
                  <span className="font-medium">{endpoints.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month Calls</span>
                  <span className="font-medium">12,459</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="font-medium">245ms</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="mapping">Prompt Mapping</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="test">Test</TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="space-y-6">
                {/* Endpoint Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Endpoint Configuration</CardTitle>
                    <CardDescription>
                      Configure the basic settings for your API endpoint.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="endpoint-name">Endpoint Name</Label>
                        <Input
                          id="endpoint-name"
                          value={endpoint.name}
                          onChange={(e) => updateEndpoint('name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="http-method">HTTP Method</Label>
                        <Select value={endpoint.method} onValueChange={(value) => updateEndpoint('method', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {httpMethods.map(method => (
                              <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="endpoint-path">Endpoint Path</Label>
                      <Input
                        id="endpoint-path"
                        value={endpoint.path}
                        onChange={(e) => updateEndpoint('path', e.target.value)}
                        className="mt-1"
                        placeholder="/api/your-endpoint"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endpoint-description">Description</Label>
                      <Textarea
                        id="endpoint-description"
                        value={endpoint.description}
                        onChange={(e) => updateEndpoint('description', e.target.value)}
                        className="mt-1"
                        placeholder="Describe what this endpoint does..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Request Schema */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Request Schema
                      <Button size="sm" variant="outline" onClick={addRequestField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Define the structure of incoming requests to your API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {endpoint.requestFields.map((field, index) => (
                        <div key={index} className="flex items-end space-x-3 p-4 border rounded-lg">
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Field Name</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateRequestField(index, 'name', e.target.value)}
                                placeholder="fieldName"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => updateRequestField(index, 'type', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Required</Label>
                              <div className="mt-1 flex items-center h-10">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateRequestField(index, 'required', checked)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={field.description}
                                onChange={(e) => updateRequestField(index, 'description', e.target.value)}
                                placeholder="Field description"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeRequestField(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {endpoint.requestFields.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No request fields defined yet.</p>
                          <p className="text-sm">Add fields to define your API request structure.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Response Schema */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Response Schema
                      <Button size="sm" variant="outline" onClick={addResponseField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Define the structure of responses from your API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {endpoint.responseFields.map((field, index) => (
                        <div key={index} className="flex items-end space-x-3 p-4 border rounded-lg">
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Field Name</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateResponseField(index, 'name', e.target.value)}
                                placeholder="fieldName"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => updateResponseField(index, 'type', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Required</Label>
                              <div className="mt-1 flex items-center h-10">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateResponseField(index, 'required', checked)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={field.description}
                                onChange={(e) => updateResponseField(index, 'description', e.target.value)}
                                placeholder="Field description"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeResponseField(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {endpoint.responseFields.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No response fields defined yet.</p>
                          <p className="text-sm">Add fields to define your API response structure.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mapping" className="space-y-6">
                {/* Prompt Mapping */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Prompt Mapping
                    </CardTitle>
                    <CardDescription>
                      Connect your API endpoint to a prompt and define how data flows between them.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="prompt-select">Select Prompt</Label>
                      <Select
                        value={endpoint.promptId}
                        onValueChange={(value) => updateEndpoint('promptId', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a prompt to connect" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrompts.map(prompt => (
                            <SelectItem key={prompt.id} value={prompt.id}>{prompt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {endpoint.promptId && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-4">Data Flow Mapping</h4>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-2">API Request Fields</div>
                                {endpoint.requestFields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between py-1">
                                    <span className="text-sm font-mono">{field.name}</span>
                                    <Badge variant="outline">{field.type}</Badge>
                                  </div>
                                ))}
                              </div>
                              <div className="flex-shrink-0">
                                <ArrowRight className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex-1 bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-2">Prompt Variables</div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-sm font-mono">topic</span>
                                    <Badge variant="outline">string</Badge>
                                  </div>
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-sm font-mono">tone</span>
                                    <Badge variant="outline">string</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-center">
                              <ArrowDown className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-2">AI Response</div>
                                <div className="text-sm font-mono text-gray-600">Generated content...</div>
                              </div>
                              <div className="flex-shrink-0">
                                <ArrowRight className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex-1 bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-2">API Response Fields</div>
                                {endpoint.responseFields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between py-1">
                                    <span className="text-sm font-mono">{field.name}</span>
                                    <Badge variant="outline">{field.type}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Response Processing</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium">Include Metadata</Label>
                                <p className="text-xs text-gray-500">Add execution time, token usage, etc.</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium">Content Filtering</Label>
                                <p className="text-xs text-gray-500">Apply content safety filters to responses</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium">Response Caching</Label>
                                <p className="text-xs text-gray-500">Cache similar requests for better performance</p>
                              </div>
                              <Switch />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Security & Authentication
                    </CardTitle>
                    <CardDescription>
                      Configure security settings and authentication methods for your API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="auth-method">Authentication Method</Label>
                      <Select
                        value={endpoint.authentication}
                        onValueChange={(value) => updateEndpoint('authentication', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api-key">API Key</SelectItem>
                          <SelectItem value="bearer-token">Bearer Token</SelectItem>
                          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                          <SelectItem value="none">No Authentication</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {endpoint.authentication === 'api-key' && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Key className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="font-medium text-blue-900">API Key Configuration</h4>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                          Clients will need to include an API key in the request headers.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Header Name</Label>
                            <Input defaultValue="X-API-Key" className="mt-1" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">Key Rotation</Label>
                              <p className="text-xs text-gray-600">Automatically rotate API keys</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="rate-limit">Rate Limiting (requests per hour)</Label>
                      <Input
                        id="rate-limit"
                        type="number"
                        value={endpoint.rateLimit}
                        onChange={(e) => updateEndpoint('rateLimit', parseInt(e.target.value))}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Set to 0 for unlimited requests
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Additional Security Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">CORS Protection</Label>
                            <p className="text-xs text-gray-500">Control cross-origin requests</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Request Validation</Label>
                            <p className="text-xs text-gray-500">Validate request schema before processing</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">IP Whitelisting</Label>
                            <p className="text-xs text-gray-500">Restrict access to specific IP addresses</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Request Logging</Label>
                            <p className="text-xs text-gray-500">Log all API requests for monitoring</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="space-y-6">
                {/* API Testing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Play className="w-5 h-5 mr-2" />
                        Test API Endpoint
                      </div>
                      <Button onClick={testEndpoint} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        <Play className="w-4 h-4 mr-2" />
                        Send Test Request
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Test your API endpoint with sample data to ensure it works correctly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Request */}
                      <div>
                        <Label className="text-sm font-medium">Test Request</Label>
                        <div className="mt-1 space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Badge variant="default">{endpoint.method}</Badge>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              https://api.promptpilot.com{endpoint.path}
                            </code>
                          </div>
                          <Textarea
                            placeholder="Enter test request JSON..."
                            value={testRequest}
                            onChange={(e) => setTestRequest(e.target.value)}
                            className="min-h-[200px] font-mono text-sm"
                          />
                        </div>
                      </div>

                      {/* Response */}
                      <div>
                        <Label className="text-sm font-medium">Response</Label>
                        <div className="mt-1">
                          <div className="bg-gray-900 text-green-400 p-4 rounded-lg min-h-[200px] font-mono text-sm whitespace-pre-wrap">
                            {testResponse || 'Click "Send Test Request" to see the response...'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Request Examples */}
                    <div>
                      <Label className="text-sm font-medium">Example Requests</Label>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-2">cURL</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block">
                            {`curl -X ${endpoint.method} \\
  https://api.promptpilot.com${endpoint.path} \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
                              endpoint.requestFields.reduce((acc, field) => {
                                acc[field.name] = field.type === 'string' ? 'example value' : 
                                                  field.type === 'number' ? 42 : 
                                                  field.type === 'boolean' ? true : 'value';
                                return acc;
                              }, {} as any), null, 2)}'`}
                          </code>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-2">JavaScript</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block">
                            {`const response = await fetch('https://api.promptpilot.com${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(
                              endpoint.requestFields.reduce((acc, field) => {
                                acc[field.name] = field.type === 'string' ? 'example value' : 
                                                  field.type === 'number' ? 42 : 
                                                  field.type === 'boolean' ? true : 'value';
                                return acc;
                              }, {} as any), null, 2)})
});`}
                          </code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}