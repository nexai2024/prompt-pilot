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
import { ArrowLeft, Play, Save, Settings, Brain, Zap, Plus, Copy, Trash2, Edit, TestTube, Variable as Variables, History, Download, Upload, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';

export default function PromptStudio() {
  const [prompt, setPrompt] = useState('');
  const [variables, setVariables] = useState([{ name: 'user_input', value: '', description: 'User input text' }]);
  const [testOutput, setTestOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);

  const promptTemplates = [
    {
      name: 'Content Generator',
      description: 'Generate engaging content from topics',
      prompt: 'Create engaging content about {{topic}}. Include key points, examples, and a compelling conclusion.',
      variables: [{ name: 'topic', value: '', description: 'Content topic' }]
    },
    {
      name: 'Sentiment Analyzer',
      description: 'Analyze text sentiment and emotions',
      prompt: 'Analyze the sentiment of the following text and provide a detailed breakdown: {{text}}',
      variables: [{ name: 'text', value: '', description: 'Text to analyze' }]
    },
    {
      name: 'Code Reviewer',
      description: 'Review code for best practices',
      prompt: 'Review the following {{language}} code and provide feedback on best practices, potential issues, and improvements: {{code}}',
      variables: [
        { name: 'language', value: '', description: 'Programming language' },
        { name: 'code', value: '', description: 'Code to review' }
      ]
    },
    {
      name: 'Email Assistant',
      description: 'Draft professional emails',
      prompt: 'Draft a professional email with the following requirements:\nSubject: {{subject}}\nRecipient: {{recipient}}\nContext: {{context}}\nTone: {{tone}}',
      variables: [
        { name: 'subject', value: '', description: 'Email subject' },
        { name: 'recipient', value: '', description: 'Email recipient' },
        { name: 'context', value: '', description: 'Email context' },
        { name: 'tone', value: '', description: 'Email tone' }
      ]
    }
  ];

  const recentPrompts = [
    { name: 'Blog Post Generator', modified: '2 hours ago', status: 'deployed' },
    { name: 'Product Description Writer', modified: '1 day ago', status: 'draft' },
    { name: 'Social Media Caption Creator', modified: '3 days ago', status: 'testing' },
    { name: 'Email Subject Line Optimizer', modified: '1 week ago', status: 'deployed' }
  ];

  const addVariable = () => {
    setVariables([...variables, { name: '', value: '', description: '' }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: string, value: string) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const loadTemplate = (template: any) => {
    setPrompt(template.prompt);
    setVariables(template.variables);
  };

  const testPrompt = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      let processedPrompt = prompt;
      variables.forEach(variable => {
        if (variable.value) {
          processedPrompt = processedPrompt.replace(new RegExp(`{{${variable.name}}}`, 'g'), variable.value);
        }
      });
      setTestOutput(`Test output for prompt:\n\n${processedPrompt}\n\nModel: ${selectedModel}\nTemperature: ${temperature}\nMax Tokens: ${maxTokens}\n\nThis would be the AI-generated response based on your prompt configuration.`);
      setIsLoading(false);
    }, 2000);
  };

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
                <Brain className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Prompt Studio</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                Version History
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Prompt
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Start Templates</CardTitle>
                <CardDescription>Choose a template to get started quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {promptTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => loadTemplate(template)}
                  >
                    <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Prompts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Prompts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPrompts.map((prompt, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{prompt.name}</p>
                      <p className="text-xs text-gray-500">{prompt.modified}</p>
                    </div>
                    <Badge variant={prompt.status === 'deployed' ? 'default' : prompt.status === 'testing' ? 'secondary' : 'outline'}>
                      {prompt.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="editor" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="editor">Prompt Editor</TabsTrigger>
                <TabsTrigger value="test">Test & Debug</TabsTrigger>
                <TabsTrigger value="settings">Model Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-6">
                {/* Prompt Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Edit className="w-5 h-5 mr-2" />
                      Prompt Editor
                    </CardTitle>
                    <CardDescription>
                      Create your AI prompt. Use {'{{variable_name}}'} syntax for dynamic variables.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="prompt-name" className="text-sm font-medium">Prompt Name</Label>
                      <Input
                        id="prompt-name"
                        placeholder="Enter a descriptive name for your prompt"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prompt-text" className="text-sm font-medium">Prompt Text</Label>
                      <Textarea
                        id="prompt-text"
                        placeholder="Enter your prompt here. Use {{variable_name}} for dynamic content..."
                        className="mt-1 min-h-[200px] font-mono"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {prompt.length} characters
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Variables */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Variables className="w-5 h-5 mr-2" />
                        Variables
                      </div>
                      <Button size="sm" variant="outline" onClick={addVariable}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Variable
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Define variables that can be dynamically replaced in your prompt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {variables.map((variable, index) => (
                      <div key={index} className="flex items-end space-x-3 p-4 border rounded-lg">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`var-name-${index}`} className="text-xs">Variable Name</Label>
                            <Input
                              id={`var-name-${index}`}
                              placeholder="variable_name"
                              value={variable.name}
                              onChange={(e) => updateVariable(index, 'name', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`var-value-${index}`} className="text-xs">Test Value</Label>
                            <Input
                              id={`var-value-${index}`}
                              placeholder="Test value"
                              value={variable.value}
                              onChange={(e) => updateVariable(index, 'value', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`var-desc-${index}`} className="text-xs">Description</Label>
                            <Input
                              id={`var-desc-${index}`}
                              placeholder="Variable description"
                              value={variable.description}
                              onChange={(e) => updateVariable(index, 'description', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeVariable(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {variables.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Variables className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No variables defined yet.</p>
                        <p className="text-sm">Add variables to make your prompts dynamic.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="space-y-6">
                {/* Test Interface */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TestTube className="w-5 h-5 mr-2" />
                        Test Your Prompt
                      </div>
                      <Button
                        onClick={testPrompt}
                        disabled={isLoading || !prompt}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        {isLoading ? 'Testing...' : 'Run Test'}
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Test your prompt with sample data to see how it performs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preview */}
                    <div>
                      <Label className="text-sm font-medium">Prompt Preview</Label>
                      <div className="mt-1 p-4 bg-gray-50 rounded-lg border">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {prompt ? (
                            variables.reduce((text, variable) => {
                              return variable.value 
                                ? text.replace(new RegExp(`{{${variable.name}}}`, 'g'), `[${variable.value}]`)
                                : text;
                            }, prompt)
                          ) : (
                            <span className="text-gray-400">Enter a prompt to see preview...</span>
                          )}
                        </pre>
                      </div>
                    </div>

                    {/* Output */}
                    <div>
                      <Label className="text-sm font-medium">Test Output</Label>
                      <div className="mt-1 p-4 bg-white rounded-lg border min-h-[200px]">
                        {testOutput ? (
                          <pre className="text-sm whitespace-pre-wrap">{testOutput}</pre>
                        ) : (
                          <div className="flex items-center justify-center h-32 text-gray-400">
                            <div className="text-center">
                              <TestTube className="w-8 h-8 mx-auto mb-2" />
                              <p>Run a test to see the output</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {/* Model Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Model Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure the AI model and parameters for your prompt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="model-select" className="text-sm font-medium">AI Model</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="claude-3">Claude-3</SelectItem>
                            <SelectItem value="cohere-command">Cohere Command</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Choose the AI model that best fits your use case.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="temperature" className="text-sm font-medium">
                          Temperature ({temperature})
                        </Label>
                        <input
                          type="range"
                          id="temperature"
                          min="0"
                          max="2"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="mt-1 w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Controls randomness. Lower values for more focused, higher for more creative responses.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="max-tokens" className="text-sm font-medium">Max Tokens</Label>
                        <Input
                          id="max-tokens"
                          type="number"
                          min="1"
                          max="4000"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum number of tokens in the response.
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Response Format</Label>
                        <Select defaultValue="text">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Plain Text</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="markdown">Markdown</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Streaming Response</Label>
                          <p className="text-xs text-gray-500">Enable real-time response streaming</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Content Filtering</Label>
                          <p className="text-xs text-gray-500">Apply content safety filters</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Caching</Label>
                          <p className="text-xs text-gray-500">Cache responses for improved performance</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>
                      Fine-tune additional parameters for your specific use case.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="top-p" className="text-sm font-medium">Top P</Label>
                        <Input
                          id="top-p"
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          defaultValue="1"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="frequency-penalty" className="text-sm font-medium">Frequency Penalty</Label>
                        <Input
                          id="frequency-penalty"
                          type="number"
                          min="-2"
                          max="2"
                          step="0.1"
                          defaultValue="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="presence-penalty" className="text-sm font-medium">Presence Penalty</Label>
                        <Input
                          id="presence-penalty"
                          type="number"
                          min="-2"
                          max="2"
                          step="0.1"
                          defaultValue="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stop-sequences" className="text-sm font-medium">Stop Sequences</Label>
                        <Input
                          id="stop-sequences"
                          placeholder="Enter stop sequences (comma-separated)"
                          className="mt-1"
                        />
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