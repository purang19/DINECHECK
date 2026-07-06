import React, { useState } from 'react';
import { Check, Download, FileText, LayoutDashboard, Sparkles } from 'lucide-react';
import { getSurveysByDate, submitSurvey } from './firebase';
import type { SurveyData, TastedItem } from './types';

const RESTAURANTS = [
  'Floating Market Restaurant',
  'Talay Restaurant',
  'Manta Ray Bistro',
  'CocoVan',
  'Room Service',
  'Banquet & Function',
];

const emptyItem = (): TastedItem => ({
  itemName: '',
  foodTaste: '',
  qualityOfIngredients: '',
  freshnessOfFood: '',
  foodTemperature: '',
  foodPresentation: '',
});

const today = () => new Date().toISOString().split('T')[0];

// Staff-service rating fields (single value each, stored flat on the survey).
type StaffRatingField = 'promptnessOfService' | 'attentivenessAndCare' | 'cleanliness' | 'value';

export default function SurveyApp() {
  const [activeView, setActiveView] = useState<'evaluation' | 'dashboard' | 'reports'>('evaluation');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Report state
  const [reportStartDate, setReportStartDate] = useState(today());
  const [reportEndDate, setReportEndDate] = useState(today());
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportError, setReportError] = useState('');

  const [formData, setFormData] = useState<SurveyData>({
    date: today(),
    name: '',
    employeeId: '',
    restaurant: '',
    timeOfService: '',
    typeOfService: '',
    tastedItems: [emptyItem()],
    promptnessOfService: '',
    attentivenessAndCare: '',
    cleanliness: '',
    value: '',
    comments: '',
  });

  const handleRadioChange = (name: StaffRatingField, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof TastedItem, value: string) => {
    setFormData((prev) => {
      const newItems = [...prev.tastedItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, tastedItems: newItems };
    });
  };

  const addTastedItem = () => {
    setFormData((prev) => ({ ...prev, tastedItems: [...prev.tastedItems, emptyItem()] }));
  };

  const removeTastedItem = (index: number) => {
    if (formData.tastedItems.length > 1) {
      setFormData((prev) => {
        const newItems = [...prev.tastedItems];
        newItems.splice(index, 1);
        return { ...prev, tastedItems: newItems };
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const scrollToTop = () => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.employeeId ||
      !formData.date ||
      !formData.restaurant ||
      !formData.timeOfService ||
      !formData.typeOfService
    ) {
      setErrorMsg('Please fill in your Name, Employee ID, Date, Restaurant, Time, and Type of Service.');
      return false;
    }

    for (const item of formData.tastedItems) {
      if (!item.itemName) {
        setErrorMsg('Please provide a name for all tasted items.');
        return false;
      }
      if (
        !item.foodTaste ||
        !item.qualityOfIngredients ||
        !item.freshnessOfFood ||
        !item.foodTemperature ||
        !item.foodPresentation
      ) {
        setErrorMsg(`Please complete all Food Quality ratings for ${item.itemName}.`);
        return false;
      }
    }

    if (
      !formData.promptnessOfService ||
      !formData.attentivenessAndCare ||
      !formData.cleanliness ||
      !formData.value
    ) {
      setErrorMsg('Please complete all Staff Service ratings.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      scrollToTop();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await submitSurvey(formData);
      setIsSuccess(true);
      scrollToTop();
    } catch (error) {
      console.error('Error submitting survey:', error);
      setErrorMsg('There was an error submitting your evaluation. Please try again.');
      scrollToTop();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep evaluator identity, reset everything else for the next evaluation.
  const resetForm = () => {
    setIsSuccess(false);
    setFormData((prev) => ({
      date: today(),
      name: prev.name,
      employeeId: prev.employeeId,
      restaurant: '',
      timeOfService: '',
      typeOfService: '',
      tastedItems: [emptyItem()],
      promptnessOfService: '',
      attentivenessAndCare: '',
      cleanliness: '',
      value: '',
      comments: '',
    }));
  };

  const renderRatingGroup = (name: StaffRatingField, label: string) => (
    <div>
      <span className="block text-sm md:text-base font-bold text-gray-700 mb-2 md:mb-4">{label}</span>
      <div className="flex justify-between gap-1 md:gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label key={`${name}-${rating}`} className="flex-1 text-center cursor-pointer">
            <input
              type="radio"
              name={name}
              value={String(rating)}
              className="sr-only peer"
              checked={formData[name] === String(rating)}
              onChange={() => handleRadioChange(name, String(rating))}
            />
            <span className="block py-2 md:py-4 border-2 md:border-4 border-transparent rounded-xl md:rounded-2xl peer-checked:bg-[#FFF2F2] peer-checked:text-[#2D2D2D] peer-checked:border-[#FF6B6B] hover:border-[#FF6B6B] bg-gray-50 text-sm md:text-base font-bold transition-all shadow-sm">
              {rating}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderItemRatingGroup = (index: number, name: keyof TastedItem, label: string) => {
    const value = formData.tastedItems[index][name];
    return (
      <div>
        <span className="block text-sm md:text-base font-bold text-gray-700 mb-2 md:mb-4">{label}</span>
        <div className="flex justify-between gap-1 md:gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={`item-${index}-${name}-${rating}`} className="flex-1 text-center cursor-pointer">
              <input
                type="radio"
                name={`item-${index}-${name}`}
                value={String(rating)}
                className="sr-only peer"
                checked={value === String(rating)}
                onChange={() => handleItemChange(index, name, String(rating))}
              />
              <span className="block py-2 md:py-4 border-2 md:border-4 border-transparent rounded-xl md:rounded-2xl peer-checked:bg-[#FFF2F2] peer-checked:text-[#2D2D2D] peer-checked:border-[#FF6B6B] hover:border-[#FF6B6B] bg-gray-50 text-sm md:text-base font-bold transition-all shadow-sm">
                {rating}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const csvCell = (value: string) => `"${(value ?? '').replace(/"/g, '""')}"`;

  const handleDownloadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDownloading(true);
    setReportError('');

    try {
      const surveys = await getSurveysByDate(reportStartDate, reportEndDate);

      if (surveys.length === 0) {
        setReportError('No evaluations found for the selected date range.');
        setIsDownloading(false);
        return;
      }

      const headers = [
        'Date',
        'Name',
        'Employee ID',
        'Restaurant',
        'Time of Service',
        'Type of Service',
        'Item Name',
        'Food Taste',
        'Quality of Ingredients',
        'Freshness',
        'Temperature',
        'Presentation',
        'Promptness',
        'Attentiveness',
        'Cleanliness',
        'Value',
        'Comments',
        'Submitted At',
      ];

      // One CSV row per tasted item so per-dish ratings are preserved.
      const csvRows = [headers.join(',')];
      for (const survey of surveys) {
        const items = survey.tastedItems?.length ? survey.tastedItems : [emptyItem()];
        for (const item of items) {
          const row = [
            survey.date,
            survey.name,
            survey.employeeId,
            survey.restaurant,
            survey.timeOfService,
            survey.typeOfService,
            item.itemName,
            item.foodTaste,
            item.qualityOfIngredients,
            item.freshnessOfFood,
            item.foodTemperature,
            item.foodPresentation,
            survey.promptnessOfService,
            survey.attentivenessAndCare,
            survey.cleanliness,
            survey.value,
            survey.comments || '',
            survey.createdAt,
          ].map((cell) => csvCell(String(cell ?? '')));
          csvRows.push(row.join(','));
        }
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluations_${reportStartDate}_to_${reportEndDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setReportError('Error fetching data. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const navButtonClass = (view: typeof activeView) =>
    `flex items-center gap-3 px-5 py-4 rounded-2xl w-full text-left font-bold transition ${
      activeView === view ? 'bg-white text-[#FF6B6B] shadow-sm' : 'bg-transparent hover:bg-white/10'
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFF9F2] font-sans text-[#2D2D2D] h-screen overflow-hidden">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex w-64 lg:w-1/4 xl:w-1/5 bg-[#FF6B6B] p-8 flex-col text-white overflow-y-auto">
        <div className="mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <div className="text-[#FF6B6B] text-3xl font-black">D</div>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-2 text-white">
            DINE
            <br />
            CHECK
          </h1>
          <p className="text-sm font-medium opacity-90">Internal Quality Check</p>
        </div>

        <div className="space-y-3 mb-auto">
          <button onClick={() => setActiveView('evaluation')} className={navButtonClass('evaluation')}>
            <FileText className="w-5 h-5" />
            Evaluation
          </button>
          <button onClick={() => setActiveView('dashboard')} className={navButtonClass('dashboard')}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button onClick={() => setActiveView('reports')} className={navButtonClass('reports')}>
            <Download className="w-5 h-5" />
            Reports
          </button>
        </div>

        <div className="bg-[#FF8787] p-5 rounded-2xl mt-8">
          <div className="text-[10px] uppercase tracking-widest font-bold mb-2 opacity-80">
            Recent Insight
          </div>
          <div className="text-2xl font-bold mb-1">4.8 / 5.0</div>
          <p className="text-xs opacity-90">Avg Food Quality this week</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-[#FF6B6B] text-white p-6 shadow-md z-10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-wide">DINE CHECK</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#FFF9F2] mt-1">
              Internal Quality Check
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('evaluation')}
              className={`p-2 rounded-lg ${activeView === 'evaluation' ? 'bg-white text-[#FF6B6B]' : 'bg-white/20'}`}
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`p-2 rounded-lg ${activeView === 'dashboard' ? 'bg-white text-[#FF6B6B]' : 'bg-white/20'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className={`p-2 rounded-lg ${activeView === 'reports' ? 'bg-white text-[#FF6B6B]' : 'bg-white/20'}`}
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-3 md:p-8 lg:p-12 w-full mx-auto" id="main-scroll">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm p-5 md:p-10 lg:p-12 border border-gray-100">
            {activeView === 'evaluation' &&
              (isSuccess ? (
                <div className="py-20 text-center space-y-6">
                  <div className="w-24 h-24 bg-[#FFF2F2] text-[#FF6B6B] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <h2 className="text-4xl font-black text-[#2D2D2D]">Thank You!</h2>
                  <p className="text-gray-500 max-w-md mx-auto text-xl leading-relaxed">
                    Your evaluation has been logged. We will review this to refine our dishes and
                    elevate our service.
                  </p>
                  <button
                    onClick={resetForm}
                    className="mt-8 bg-[#2D2D2D] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform"
                  >
                    Submit Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-12">
                  {errorMsg && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-2xl text-sm font-bold border-2 border-red-200">
                      {errorMsg}
                    </div>
                  )}

                  {/* SECTION 1: DETAILS */}
                  <section className="space-y-6">
                    <div className="border-b-2 border-gray-100 pb-4 mb-4 md:mb-6">
                      <h2 className="text-xl md:text-2xl font-black text-[#2D2D2D] flex items-center gap-2 md:gap-3">
                        Evaluation Details <span className="text-2xl md:text-3xl">📋</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1 md:mb-2">
                          Evaluator Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border-2 md:border-4 border-transparent focus:border-[#FF6B6B] outline-none text-sm md:text-base font-medium"
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="employeeId"
                          className="block text-sm font-bold text-gray-700 mb-1 md:mb-2"
                        >
                          Employee ID
                        </label>
                        <input
                          type="text"
                          id="employeeId"
                          name="employeeId"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border-2 md:border-4 border-transparent focus:border-[#FF6B6B] outline-none text-sm md:text-base font-medium"
                          placeholder="EMP-1234"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="date" className="block text-sm font-bold text-gray-700 mb-1 md:mb-2">
                          Evaluation Date
                        </label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border-2 md:border-4 border-transparent focus:border-[#FF6B6B] outline-none text-sm md:text-base font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2">
                      <div className="md:col-span-2">
                        <label
                          htmlFor="restaurant"
                          className="block text-sm font-bold text-gray-700 mb-1 md:mb-2"
                        >
                          Restaurant
                        </label>
                        <select
                          id="restaurant"
                          name="restaurant"
                          value={formData.restaurant}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border-2 md:border-4 border-transparent focus:border-[#FF6B6B] outline-none text-sm md:text-base font-medium cursor-pointer"
                        >
                          <option value="">Select a restaurant...</option>
                          {RESTAURANTS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="timeOfService"
                          className="block text-sm font-bold text-gray-700 mb-1 md:mb-2"
                        >
                          Time of Service
                        </label>
                        <select
                          id="timeOfService"
                          name="timeOfService"
                          value={formData.timeOfService}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border-2 md:border-4 border-transparent focus:border-[#FF6B6B] outline-none text-sm md:text-base font-medium cursor-pointer"
                        >
                          <option value="">Select time...</option>
                          <option value="Breakfast">Breakfast</option>
                          <option value="Lunch">Lunch</option>
                          <option value="Dinner">Dinner</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="typeOfService"
                          className="block text-sm font-bold text-gray-700 mb-1 md:mb-2"
                        >
                          Type of Service
                        </label>
                        <select
                          id="typeOfService"
                          name="typeOfService"
                          value={formData.typeOfService}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border-2 md:border-4 border-transparent focus:border-[#FF6B6B] outline-none text-sm md:text-base font-medium cursor-pointer"
                        >
                          <option value="">Select type...</option>
                          <option value="A la carte">A la carte</option>
                          <option value="Buffet">Buffet</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 2: FOOD QUALITY */}
                  <section className="space-y-4 md:space-y-6 pt-4">
                    <div className="border-b-2 border-gray-100 pb-2 md:pb-4 mb-4 md:mb-6 flex justify-between items-center">
                      <h2 className="text-xl md:text-2xl font-black text-[#2D2D2D] flex items-center gap-2 md:gap-3">
                        What did you taste today? <span className="text-2xl md:text-3xl">🍲</span>
                      </h2>
                    </div>

                    {formData.tastedItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-gray-100 space-y-6 md:space-y-8 shadow-sm relative"
                      >
                        {formData.tastedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTastedItem(index)}
                            className="absolute top-4 right-4 text-red-500 font-bold text-xs md:text-sm bg-red-50 px-2 py-1 md:px-3 md:py-1 rounded-lg md:rounded-xl hover:bg-red-100"
                          >
                            Remove
                          </button>
                        )}

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1 md:mb-2 mt-4 md:mt-0">
                            Item Name {index + 1}
                          </label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            className="w-full bg-gray-50 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border-2 border-transparent focus:border-[#FF6B6B] outline-none text-sm md:text-base font-medium"
                            placeholder="e.g. Tom Yum Goong"
                          />
                        </div>

                        <div className="space-y-4 md:space-y-8">
                          {renderItemRatingGroup(index, 'foodTaste', 'Food Taste')}
                          {renderItemRatingGroup(index, 'qualityOfIngredients', 'Quality of Ingredients')}
                          {renderItemRatingGroup(index, 'freshnessOfFood', 'Freshness of Food')}
                          {renderItemRatingGroup(index, 'foodTemperature', 'Appropriate Food Temperature')}
                          {renderItemRatingGroup(index, 'foodPresentation', 'Food Presentation')}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addTastedItem}
                      className="w-full bg-[#FFF2F2] text-[#FF6B6B] px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-[#ffe5e5] transition flex items-center justify-center gap-2 border-2 border-[#FF6B6B]"
                    >
                      + ADD ANOTHER ITEM
                    </button>
                  </section>

                  {/* SECTION 3: STAFF SERVICE */}
                  <section className="space-y-4 md:space-y-6 pt-4">
                    <div className="border-b-2 border-gray-100 pb-2 md:pb-4 mb-4 md:mb-6">
                      <h2 className="text-xl md:text-2xl font-black text-[#2D2D2D] flex items-center gap-2 md:gap-3">
                        Staff Service <span className="text-2xl md:text-3xl">🤵</span>
                      </h2>
                    </div>
                    <div className="space-y-4 md:space-y-8">
                      {renderRatingGroup('promptnessOfService', 'Promptness of Service')}
                      {renderRatingGroup('attentivenessAndCare', 'Attentiveness and Care')}
                      {renderRatingGroup('cleanliness', 'Cleanliness of the Restaurant')}
                      {renderRatingGroup('value', 'Value for Money')}
                    </div>
                  </section>

                  {/* SECTION 4: FINAL */}
                  <section className="space-y-4 md:space-y-6 pt-4">
                    <div className="border-b-2 border-gray-100 pb-2 md:pb-4 mb-4 md:mb-6">
                      <h2 className="text-xl md:text-2xl font-black text-[#2D2D2D] flex items-center gap-2 md:gap-3">
                        Additional Comments <span className="text-2xl md:text-3xl">📝</span>
                      </h2>
                    </div>

                    <div>
                      <label
                        htmlFor="comments"
                        className="block text-sm md:text-base font-bold text-gray-700 mb-2 md:mb-4"
                      >
                        Detailed feedback &amp; suggestions:
                      </label>
                      <textarea
                        id="comments"
                        name="comments"
                        rows={5}
                        value={formData.comments}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border-2 md:border-4 border-transparent focus:border-[#FF6B6B] outline-none text-base md:text-lg resize-none"
                        placeholder="Let us know about the flavor profile, presentation, or any needed adjustments..."
                      ></textarea>
                    </div>
                  </section>

                  {/* Submit Action */}
                  <div className="pt-6 md:pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6 mt-6 md:mt-10 border-t-2 border-gray-100">
                    <div className="text-sm font-bold text-gray-400 italic text-center sm:text-left">
                      "Your feedback drives our culinary excellence!"
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-[#2D2D2D] text-white px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 md:gap-3 disabled:opacity-70 disabled:hover:scale-100 shadow-xl"
                    >
                      {isSubmitting ? (
                        'SUBMITTING...'
                      ) : (
                        <>
                          SUBMIT EVALUATION <Check className="w-5 h-5 md:w-6 md:h-6" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ))}

            {activeView === 'dashboard' && (
              <div className="py-20 text-center space-y-6">
                <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LayoutDashboard className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-[#2D2D2D]">Dashboard</h2>
                <p className="text-gray-500 max-w-md mx-auto text-xl leading-relaxed">
                  The dashboard feature is currently in development.
                </p>
              </div>
            )}

            {activeView === 'reports' && (
              <div className="space-y-8">
                <div className="border-b-2 border-gray-100 pb-4 mb-6">
                  <h2 className="text-3xl font-black text-[#2D2D2D] flex items-center gap-3">
                    Reports &amp; Exports <span className="text-4xl">📊</span>
                  </h2>
                  <p className="text-gray-500 mt-2 text-lg">
                    Filter evaluation data by date and download it as a CSV file.
                  </p>
                </div>

                <form onSubmit={handleDownloadReport} className="space-y-8">
                  {reportError && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-2xl text-sm font-bold border-2 border-red-200">
                      {reportError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div>
                      <label
                        htmlFor="reportStartDate"
                        className="block text-sm font-bold text-gray-700 mb-2"
                      >
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="reportStartDate"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent focus:border-[#FF6B6B] outline-none text-base font-medium"
                      />
                    </div>
                    <div>
                      <label htmlFor="reportEndDate" className="block text-sm font-bold text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="reportEndDate"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent focus:border-[#FF6B6B] outline-none text-base font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isDownloading}
                    className="w-full bg-[#FF6B6B] text-white px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100 shadow-xl"
                  >
                    {isDownloading ? (
                      'PREPARING DOWNLOAD...'
                    ) : (
                      <>
                        DOWNLOAD CSV <Download className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer space */}
          <div className="h-16"></div>
        </div>
      </div>
    </div>
  );
}
