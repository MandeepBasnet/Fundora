import React, { useState } from 'react';
import { 
  CheckCircle2, ChevronRight, ChevronLeft, Upload, Plus, Trash2, Calendar, DollarSign, Image as ImageIcon, Video, Save
} from 'lucide-react';
import { Button, Card, Input, Progress } from '../../components/ui';

export function StartCampaign() {
  const [step, setStep] = useState(1);
  const [fundingType, setFundingType] = useState('Reward-based');
  
  // Calculate total steps based on funding type
  const totalSteps = fundingType === 'Milestone-based' ? 6 : 5;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Start a Campaign</h1>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500 mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% Completed</span>
            </div>
          </div>
          <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100 w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" /> Save as Draft
          </Button>
        </div>
        <Progress value={progress} className="h-2 mb-8" />

        <Card className="p-6 md:p-8 border-slate-200 shadow-lg">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Campaign Title</label>
                  <Input placeholder="e.g., Smart Solar Backpack" />
                  <p className="text-xs text-slate-500">Keep it short and impactful.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <option>Technology</option>
                    <option>Agriculture</option>
                    <option>Education</option>
                    <option>Health</option>
                    <option>Community</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea 
                    className="flex min-h-[150px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Tell your story..."
                  />
                  <p className="text-xs text-slate-500">Minimum 100 characters.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Funding Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Funding Details</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Funding Goal (NPR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rs.</span>
                    <Input type="number" placeholder="50000" className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Duration (Days)</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <option>30 Days</option>
                    <option>45 Days</option>
                    <option>60 Days</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Funding Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Reward-based', 'Donation-based', 'Milestone-based'].map((type) => (
                      <div 
                        key={type} 
                        onClick={() => setFundingType(type)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          fundingType === type 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' 
                            : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        <div className="font-medium">{type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Media Upload */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Media Upload</h2>
              
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50">
                  <div className="inline-flex p-4 bg-white rounded-full shadow-sm mb-4">
                    <ImageIcon className="w-8 h-8 text-sky-600" />
                  </div>
                  <h3 className="font-medium text-slate-900">Upload Campaign Images</h3>
                  <p className="text-sm text-slate-500 mt-1">Drag & drop or click to browse</p>
                  <p className="text-xs text-slate-400 mt-2">JPG, PNG, GIF up to 5MB</p>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50">
                  <div className="inline-flex p-4 bg-white rounded-full shadow-sm mb-4">
                    <Video className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-slate-900">Upload Pitch Video</h3>
                  <p className="text-sm text-slate-500 mt-1">MP4, MOV up to 100MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Rewards/Milestones */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Rewards & Tiers</h2>
              
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-6 relative">
                  <button className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-lg mb-4">Reward Tier #1</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Title</label>
                      <Input placeholder="Early Bird Special" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Amount (NPR)</label>
                      <Input type="number" placeholder="1000" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium text-slate-700">Description</label>
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-sky-600 hover:border-blue-600">
                  <Plus className="w-5 h-5 mr-2" /> Add Another Reward Tier
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Milestones (Only if Milestone-based) */}
          {step === 5 && fundingType === 'Milestone-based' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Project Milestones</h2>
              <p className="text-sm text-slate-500">Define the key phases of your project. Funds will be released upon verification of each milestone.</p>
              
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-6 relative">
                  <button className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Milestone #1</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">25% of Funds</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Milestone Title</label>
                      <Input placeholder="e.g., Prototype Development" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Description & Deliverables</label>
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        placeholder="What will you achieve in this phase?"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Percentage (%)</label>
                        <Input type="number" placeholder="25" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Est. Completion Date</label>
                        <Input type="date" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-sky-600 hover:border-blue-600">
                  <Plus className="w-5 h-5 mr-2" /> Add Another Milestone
                </Button>
              </div>
            </div>
          )}

          {/* Final Step: Review */}
          {step === totalSteps && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-green-100 rounded-full text-green-600 mb-4">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Ready to Launch?</h2>
                <p className="text-slate-500 mt-2">Review your campaign details before submitting for approval.</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Title</span>
                  <span className="font-medium">Smart Solar Backpack</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium">Technology</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Goal</span>
                  <span className="font-medium">Rs. 50,000</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-medium">30 Days</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Funding Type</span>
                  <span className="font-medium">{fundingType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <Button 
              variant="ghost" 
              onClick={prevStep} 
              disabled={step === 1}
              className={step === 1 ? 'invisible' : ''}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            
            {step < totalSteps ? (
              <Button onClick={nextStep} className="bg-sky-600 hover:bg-blue-700">
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button className="bg-green-600 hover:bg-green-700 px-8">
                Submit for Approval
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
