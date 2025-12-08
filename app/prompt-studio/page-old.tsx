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
import { ArrowLeft, Play, Save, Settings, Brain, Zap, Plus, Copy, Trash2, Edit, TestTube, Variable as Variables, History, Download, Upload, RefreshCw, Check, X, AlertTriangle, Sparkles, Code, Wand2 } from 'lucide-react';

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
      variables: [{ name: 'topic', value: '', description: 'Content topic' }],
      category: 'Content',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Sentiment Analyzer',
      description: 'Analyze text sentiment and emotions',
      prompt: 'Analyze the sentiment of the following text and provide a detailed breakdown: {{text}}',
      variables: [{ name: 'text', value: '', description: 'Text to analyze' }],
      category: 'Analysis',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Code Reviewer',
      description: 'Review code for best practices',
      prompt: 'Review the following {{language}} code and provide feedback on best practices, potential issues, and improvements: {{code}}',
      variables: [
        { name: 'language', value: '', description: 'Programming language' },
        { name: 'code', value: '', description: 'Code to review' }
      ],
      category: 'Development',
      color: 'from-green-500 to-emerald-500'
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
      ],
      category: 'Communication',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const recentPrompts = [
    { name: 'Blog Post Generator', modified: '2 hours ago', status: 'deployed', category: 'Content' },
    { name: 'Product Description Writer', modified: '1 day ago', status: 'draft', category: 'Marketing' },
    { name: 'Social Media Caption Creator', modified: '3 days ago', status: 'testing', category: 'Social' },
    { name: 'Email Subject Line Optimizer', modified: '1 week ago', status: 'deployed', category: 'Email' }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
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
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Prompt Studio</h1>
                <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <History className="w-4 h-4 mr-2" />
                Version History
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
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
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg flex items-center">
                  <Wand2 className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Start Templates
                </CardTitle>
                <CardDescription>Choose a template to get started quickly</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {promptTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 group"
                    onClick={() => loadTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-purple-600 transition-colors">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{template.description}</p>
                    <div className={`mt-2 h-1 bg-gradient-to-r ${template.color} rounded-full opacity-60`}></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Prompts */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg flex items-center">
                  <History className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {recentPrompts.map((prompt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{prompt.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">{prompt.modified}</p>
                        <Badge variant="outline" className="text-xs">{prompt.category}</Badge>
                      </div>
                    </div>
                    <Badge variant={prompt.status === 'deployed' ? 'default' : prompt.status === 'testing' ? 'secondary' : 'outline'} className="ml-2">
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
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="editor" className="rounded-lg">Prompt Editor</TabsTrigger>
                <TabsTrigger value="test" className="rounded-lg">Test & Debug</TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg">Model Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-6">
                {/* Prompt Editor */}
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center">
                      <Edit className="w-5 h-5 mr-2 text-green-600" />
                      Prompt Editor
                    </CardTitle>
                    <CardDescription>
                      Create your AI prompt. Use {'{{variable_name}}'} syntax for dynamic variables.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label htmlFor="prompt-name" className="text-sm font-medium">Prompt Name</Label>
                      <Input
                        id="prompt-name"
                        placeholder="Enter a descriptive name for your prompt"
                        className="mt-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prompt-text" className="text-sm font-medium">Prompt Text</Label>
                      <Textarea
                        id="prompt-text"
                        placeholder="Enter your prompt here. Use {{variable_name}} for dynamic content..."
                        className="mt-2 min-h-[200px] font-mono border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {prompt.length} characters
                        </p>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Code className="w-3 h-3 mr-1" />
                          Format
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Variables */}
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Variables className="w-5 h-5 mr-2 text-blue-600" />
                        Variables
                      </div>
                      <Button size="sm" variant="outline" onClick={addVariable} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Variable
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Define variables that can be dynamically replaced in your prompt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {variables.map((variable, index) => (
                      <div key={index} className="flex items-end space-x-3 p-4 border border-gray-100 rounded-xl bg-gray-50">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`var-name-${index}`} className="text-xs font-medium">Variable Name</Label>
                            <Input
                              id={`var-name-${index}`}
                              placeholder="variable_name"
                              value={variable.name}
                              onChange={(e) => updateVariable(index, 'name', e.target.value)}
                              className="mt-1 border-gray-200"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`var-value-${index}`} className="text-xs font-medium">Test Value</Label>
                            <Input
                              id={`var-value-${index}`}
                              placeholder="Test value"
                              value={variable.value}
                              onChange={(e) => updateVariable(index, 'value', e.target.value)}
                              className="mt-1 border-gray-200"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`var-desc-${index}`} className="text-xs font-medium">Description</Label>
                            <Input
                              id={`var-desc-${index}`}
                              placeholder="Variable description"
                              value={variable.description}
                              onChange={(e) => updateVariable(index, 'description', e.target.value)}
                              className="mt-1 border-gray-200"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeVariable(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {variables.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Variables className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No variables defined yet.</p>
                        <p className="text-sm">Add variables to make your prompts dynamic.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="space-y-6">
                {/* Test Interface */}
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TestTube className="w-5 h-5 mr-2 text-orange-600" />
                        Test Your Prompt
                      </div>
                      <Button
                        onClick={testPrompt}
                        disabled={isLoading || !prompt}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
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
                  <CardContent className="p-6 space-y-6">
                    {/* Preview */}
                    <div>
                      <Label className="text-sm font-medium">Prompt Preview</Label>
                      <div className="mt-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
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
                      <div className="mt-2 p-4 bg-gray-900 rounded-xl border min-h-[200px] relative overflow-hidden">
                        {isLoading && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                            <div className="flex items-center space-x-2 text-green-400">
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span>Generating response...</span>
                            </div>
                          </div>
                        )}
                        {testOutput ? (
                          <pre className="text-sm whitespace-pre-wrap text-green-400">{testOutput}</pre>
                        ) : (
                          <div className="flex items-center justify-center h-32 text-gray-500">
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
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-purple-600" />
                      Model Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure the AI model and parameters for your prompt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="model-select" className="text-sm font-medium">AI Model</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="mt-2 border-gray-200">
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
                        <div className="mt-2 px-3 py-2 border border-gray-200 rounded-lg">
                          <input
                            type="range"
                            id="temperature"
                            min="0"
                            max="2"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                        </div>
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
                          className="mt-2 border-gray-200"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum number of tokens in the response.
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Response Format</Label>
                        <Select defaultValue="text">
                          <SelectTrigger className="mt-2 border-gray-200">
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

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900">Advanced Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Streaming Response</Label>
                            <p className="text-xs text-gray-500">Enable real-time response streaming</p>
                          </div>
                          <Switch />
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Content Filtering</Label>
                            <p className="text-xs text-gray-500">Apply content safety filters</p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Caching</Label>
                            <p className="text-xs text-gray-500">Cache responses for improved performance</p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Auto-save</Label>
                            <p className="text-xs text-gray-500">Automatically save changes</p>
                          </div>
                          <Switch defaultChecked />
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