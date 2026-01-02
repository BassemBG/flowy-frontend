import React, { useState } from "react";

export default function Pronunciation() {
  const [file, setFile] = useState<File | null>(null);
  const [refText, setRefText] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [xaiResult, setXaiResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [xaiLoading, setXaiLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : "");
  };

  const getApiUrl = (endpoint: string) => {
    const envBase = (import.meta as any)?.env?.VITE_API_BASE || "";
    return envBase
      ? `${envBase.replace(/\/+$/, "")}/pronunciation_service/${endpoint}`
      : `http://127.0.0.1:5000/${endpoint}`;
  };

  const fetchApi = async (endpoint: string, formData: FormData) => {
    const url = getApiUrl(endpoint);
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    if (!text || text.trim().length === 0) {
      return { error: `Empty response (status ${res.status})` };
    }

    try {
      const data = JSON.parse(text);
      if (!res.ok && !data?.error) {
        return {
          error: `Request failed with status ${res.status}`,
          body: data,
        };
      }
      return data;
    } catch (e) {
      return {
        error: `Failed to parse JSON (status ${res.status})`,
        body: text,
      };
    }
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (refText) fd.append("ref_text", refText);

    try {
      const data = await fetchApi("predict", fd);
      setResult(data);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const explainXAI = async () => {
    if (!file) return;
    setXaiLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("k", "5");
    fd.append("seg_ms", "250");

    try {
      const data = await fetchApi("xai", fd);
      setXaiResult(data);
    } catch (err) {
      setXaiResult({ error: String(err) });
    } finally {
      setXaiLoading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setFileName("");
    setRefText("");
    setResult(null);
    setXaiResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff3e8] to-[#f1e8ff] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ff8b4d] to-[#c63ad6] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Pronunciation Evaluation
                </h1>
                <p className="text-white/80">
                  Upload a WAV file to analyze pronunciation accuracy
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 md:p-8">
            <div className="space-y-6">
              {/* File Upload Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 bg-[#ffe3d3] text-[#c63ad6] rounded-full mr-3">
                    1
                  </span>
                  Upload Audio File
                </h2>

                <div className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      file
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-[#ffb07a] hover:bg-[#fff3e8]"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-[#ffe3d3] rounded-full">
                        <svg
                          className="w-8 h-8 text-[#c63ad6]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-700 mb-1">
                          {fileName || "Choose a WAV file to upload"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports .wav format only
                        </p>
                      </div>
                      <label className="cursor-pointer">
                        <span className="px-4 py-2 text-white rounded-lg transition-colors duration-200 inline-block bg-gradient-to-r from-[#ff8b4d] to-[#c63ad6] hover:opacity-90">
                          Browse Files
                        </span>
                        <input
                          type="file"
                          accept="audio/wav"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {fileName && (
                    <div className="flex items-center justify-between bg-[#fff3e8] p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#ffe3d3] rounded-lg">
                          <svg
                            className="w-5 h-5 text-[#c63ad6]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-[#c63ad6] font-medium">
                          {fileName}
                        </span>
                      </div>
                      <span className="text-sm text-[#c63ad6]">
                        Ready for analysis
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Text Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 bg-[#ffe3d3] text-[#c63ad6] rounded-full mr-3">
                    2
                  </span>
                  Reference Text (Optional)
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    Enter the expected transcript for more accurate
                    pronunciation analysis
                  </p>
                  <div className="relative">
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#c63ad6] focus:border-[#c63ad6] transition-all duration-200 resize-none"
                      value={refText}
                      onChange={(e) => setRefText(e.target.value)}
                      placeholder="Type the expected transcription here..."
                      rows={3}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {refText.length}/500
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-center gap-4 pt-2">
                <button
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                    !file || loading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#ff8b4d] to-[#c63ad6] text-white hover:opacity-90 hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
                  onClick={submit}
                  disabled={!file || loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Predict Scores</span>
                    </>
                  )}
                </button>

                <button
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                    !file || xaiLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
                  onClick={explainXAI}
                  disabled={!file || xaiLoading}
                >
                  {xaiLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Computing...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      <span>Explain (XAI)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Results Section */}
              {result && (
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full mr-3">
                      ✓
                    </span>
                    Pronunciation Scores
                  </h2>

                  {result.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 text-red-800">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium">Error occurred:</span>
                      </div>
                      <pre className="mt-2 text-red-600 whitespace-pre-wrap">
                        {result.error}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Score Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {result.scores?.accuracy !== undefined && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 font-medium mb-2">
                                Accuracy
                              </div>
                              <div className="text-3xl font-bold text-green-600">
                                {result.scores.accuracy}
                                <span className="text-lg text-gray-500">
                                  /10
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {result.scores?.fluency !== undefined && (
                          <div className="bg-gradient-to-br from-[#ffe3d3] to-[#f6e0ff] p-5 rounded-xl border border-[#f1c8ff]">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 font-medium mb-2">
                                Fluency
                              </div>
                              <div className="text-3xl font-bold text-[#c63ad6]">
                                {result.scores.fluency}
                                <span className="text-lg text-gray-500">
                                  /10
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {result.scores?.prosodic !== undefined && (
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-200">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 font-medium mb-2">
                                Prosodic
                              </div>
                              <div className="text-3xl font-bold text-orange-600">
                                {result.scores.prosodic}
                                <span className="text-lg text-gray-500">
                                  /10
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-5 rounded-xl border border-purple-200">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 font-medium mb-2">
                              Completeness
                            </div>
                            <div className="text-3xl font-bold text-purple-600">
                              {result.completeness !== null &&
                              result.completeness !== undefined
                                ? result.completeness
                                : "-"}
                              {result.completeness !== null &&
                                result.completeness !== undefined && (
                                  <span className="text-lg text-gray-500">
                                    /10
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sample Info */}
                      <div className="text-sm text-gray-500 flex gap-4">
                        {result.sr && <span>Sample rate: {result.sr} Hz</span>}
                        {result.n_samples && (
                          <span>Samples: {result.n_samples}</span>
                        )}
                      </div>

                      {/* ASR Output */}
                      {result.hyp_text && (
                        <div className="bg-[#fff3e8] border border-[#ffd2b3] rounded-xl p-4">
                          <h3 className="font-semibold text-[#c63ad6] mb-2 flex items-center gap-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                              />
                            </svg>
                            ASR Output (Detected Text)
                          </h3>
                          <p className="text-gray-800 text-lg">
                            {result.hyp_text}
                          </p>
                        </div>
                      )}

                      {/* Reference Text */}
                      {result.ref_text && (
                        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Reference Text
                          </h3>
                          <p className="text-gray-800 text-lg mb-2">
                            {result.ref_text}
                          </p>
                          {result.wer !== null && result.wer !== undefined && (
                            <p className="text-sm text-gray-600">
                              Word Error Rate (WER):{" "}
                              <span className="font-semibold">
                                {result.wer}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* XAI Results Section */}
              {xaiResult && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full mr-3">
                      🔍
                    </span>
                    XAI: Top Important Time Segments
                  </h2>

                  {xaiResult.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 text-red-800">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium">Error occurred:</span>
                      </div>
                      <pre className="mt-2 text-red-600 whitespace-pre-wrap">
                        {xaiResult.error}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-600">
                        Each segment shows where the model is most sensitive in
                        the audio.
                        {xaiResult.duration_s &&
                          ` Total duration: ${xaiResult.duration_s}s`}
                      </p>

                      {/* Accuracy Segments */}
                      {xaiResult.segments?.accuracy && (
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                            Accuracy
                          </h3>
                          <div className="space-y-2">
                            {xaiResult.segments.accuracy.map(
                              (seg: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-green-50 p-3 rounded"
                                >
                                  <span className="text-sm text-gray-700">
                                    {seg.t_start?.toFixed(2)}s -{" "}
                                    {seg.t_end?.toFixed(2)}s
                                  </span>
                                  <span className="text-sm font-semibold text-green-700">
                                    Importance: {seg.importance?.toFixed(4)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fluency Segments */}
                      {xaiResult.segments?.fluency && (
                        <div className="bg-white rounded-lg p-4 border border-[#f1c8ff]">
                          <h3 className="font-semibold text-[#c63ad6] mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 bg-[#c63ad6] rounded-full"></span>
                            Fluency
                          </h3>
                          <div className="space-y-2">
                            {xaiResult.segments.fluency.map(
                              (seg: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-[#fff3e8] p-3 rounded"
                                >
                                  <span className="text-sm text-gray-700">
                                    {seg.t_start?.toFixed(2)}s -{" "}
                                    {seg.t_end?.toFixed(2)}s
                                  </span>
                                  <span className="text-sm font-semibold text-[#c63ad6]">
                                    Importance: {seg.importance?.toFixed(4)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Prosodic Segments */}
                      {xaiResult.segments?.prosodic && (
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                            Prosodic
                          </h3>
                          <div className="space-y-2">
                            {xaiResult.segments.prosodic.map(
                              (seg: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-orange-50 p-3 rounded"
                                >
                                  <span className="text-sm text-gray-700">
                                    {seg.t_start?.toFixed(2)}s -{" "}
                                    {seg.t_end?.toFixed(2)}s
                                  </span>
                                  <span className="text-sm font-semibold text-orange-700">
                                    Importance: {seg.importance?.toFixed(4)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 text-center">
            <p className="text-gray-500 text-sm">
              Upload your audio file to receive detailed pronunciation feedback
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
