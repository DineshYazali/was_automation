import { useState } from "react";

export default function JvmChecks() {
  const [clientMnemonic, setClientMnemonic] = useState("");
  const [domain, setDomain] = useState("");
  const [odrNode, setOdrNode] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResult(false);

    try {
      const response = await fetch("http://localhost:5000/api/execute-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientMnemonic,
          domain,
          odrNode,
          selectedAction,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
      setShowResult(true);
    } catch (error) {
      console.error("Error executing action:", error);
      setResult(`Error: ${error.message}`);
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6">
          <h1 className="text-2xl font-bold text-white text-center">
            JVM Prechecks & Post Checks
          </h1>
          <p className="text-purple-100 text-center mt-2 text-sm">
            Configure and execute JVM maintenance operations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label
              htmlFor="clientMnemonic"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Client Mnemonic
            </label>
            <input
              type="text"
              id="clientMnemonic"
              value={clientMnemonic}
              onChange={(e) => setClientMnemonic(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
              placeholder="Enter client mnemonic"
              required
            />
          </div>

          <div>
            <label
              htmlFor="domain"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Domain
            </label>
            <input
              type="text"
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
              placeholder="Enter domain"
              required
            />
          </div>

          <div>
            <label
              htmlFor="odrNode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ODR Node
            </label>
            <input
              type="text"
              id="odrNode"
              value={odrNode}
              onChange={(e) => setOdrNode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
              placeholder="Enter ODR node"
              required
            />
          </div>

          <div>
            <label
              htmlFor="action"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Action
            </label>
            <div className="relative">
              <select
                id="action"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white transition duration-200"
                required
              >
                <option value="">Select an action</option>
                <option value="was-cell-status">WAS Cell Status</option>
                <option value="jdbc-test">JDBC Test</option>
                <option value="cycle-jvm">Cycle the JVM's</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={
                isLoading ||
                !clientMnemonic ||
                !domain ||
                !odrNode ||
                !selectedAction
              }
              className={`px-6 py-3 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-300 ${
                isLoading ||
                !clientMnemonic ||
                !domain ||
                !odrNode ||
                !selectedAction
                  ? "bg-purple-300 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 transform hover:-translate-y-1"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Processing...
                </div>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>

        {showResult && (
          <div className="px-8 pb-8">
            <div className="mt-2 p-4 bg-purple-50 border border-purple-200 rounded-lg max-h-80 overflow-auto">
              <h3 className="text-sm font-medium text-purple-800 mb-2">
                Operation Result:
              </h3>
              <p className="text-sm font-mono text-purple-700 whitespace-pre-wrap">
                {result}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
