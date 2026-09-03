import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Copy, 
  Check, 
  Layers, 
  Database, 
  Key, 
  Play, 
  Terminal, 
  Cpu, 
  FileCode2, 
  BookOpen, 
  Sparkles, 
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { JAVA_PROJECT_FILES, JavaCodeFile } from '../../data/javaCodeTemplates';

interface JavaArchitectureExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JavaArchitectureExplorer: React.FC<JavaArchitectureExplorerProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'concepts' | 'code' | 'api-tester'>('concepts');
  const [selectedFile, setSelectedFile] = useState<JavaCodeFile>(JAVA_PROJECT_FILES[0]);
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null);

  // API Tester states
  const [selectedEndpoint, setSelectedEndpoint] = useState<'LOGIN' | 'AVAILABLE_CARS' | 'CREATE_BOOKING' | 'PROCESS_RETURN'>('AVAILABLE_CARS');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const handleCopyCode = (code: string, filename: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFilename(filename);
    setTimeout(() => setCopiedFilename(null), 2000);
  };

  const handleExecuteApiTest = (endpointKey: 'LOGIN' | 'AVAILABLE_CARS' | 'CREATE_BOOKING' | 'PROCESS_RETURN') => {
    setIsLoadingApi(true);
    setApiResponse(null);

    setTimeout(() => {
      setIsLoadingApi(false);
      switch (endpointKey) {
        case 'LOGIN':
          setApiResponse(JSON.stringify({
            status: 200,
            tokenType: "Bearer",
            accessToken: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGV4LnJpdmVyYUBleGFtcGxlLmNvbSIsInJvbGVzIjoiUk9MRV9DVVNUT01FUiIsImlhdCI6MTcyNTMyNDAwMCwiZXhwIjoxNzI1NDEwNDAwfQ.SignatureValidated",
            user: {
              id: 1,
              email: "alex.rivera@example.com",
              name: "Alex Rivera",
              roles: ["ROLE_CUSTOMER"]
            }
          }, null, 2));
          break;

        case 'AVAILABLE_CARS':
          setApiResponse(JSON.stringify({
            status: 200,
            count: 3,
            criteria: { category: "ALL", pickupDate: "2026-09-10", returnDate: "2026-09-15" },
            data: [
              {
                id: 1,
                make: "Tesla",
                model: "Model 3 Long Range",
                category: "Electric",
                dailyRate: 89.00,
                status: "AVAILABLE",
                licensePlate: "EV-884-NY",
                fuelType: "Electric",
                seats: 5
              },
              {
                id: 2,
                make: "BMW",
                model: "530i xDrive Sedan",
                category: "Luxury",
                dailyRate: 115.00,
                status: "AVAILABLE",
                licensePlate: "BM-530-CA",
                fuelType: "Petrol",
                seats: 5
              },
              {
                id: 3,
                make: "Toyota",
                model: "RAV4 Hybrid XSE",
                category: "SUV",
                dailyRate: 68.00,
                status: "AVAILABLE",
                licensePlate: "TY-442-TX",
                fuelType: "Hybrid",
                seats: 5
              }
            ]
          }, null, 2));
          break;

        case 'CREATE_BOOKING':
          setApiResponse(JSON.stringify({
            status: 201,
            message: "Reservation successfully generated & locked",
            bookingNumber: "CRMS-2026-9182",
            strategyApplied: "Weekly Special (15% Off)",
            basePrice: 476.00,
            discountAmount: 71.40,
            insuranceCost: 126.00,
            totalAmount: 587.59,
            securityDepositHeld: 200.00,
            paymentStatus: "PAID",
            vehicleStatusTransition: "AVAILABLE -> RENTED"
          }, null, 2));
          break;

        case 'PROCESS_RETURN':
          setApiResponse(JSON.stringify({
            status: 200,
            bookingNumber: "CRMS-2026-8941",
            hoursLate: 3,
            lateReturnCalculation: {
              policy: "1.5x regular hourly rate penalty",
              hourlyRate: 16.87,
              penaltyMultiplier: 1.5,
              assessedLateFee: 75.92,
              fuelFee: 0.00,
              totalLateCharges: 75.92
            },
            vehicleStatusTransition: "RENTED -> AVAILABLE",
            inspectionStatus: "PASSED_WITH_PENALTY"
          }, null, 2));
          break;
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="java-architecture-explorer-modal"
        className="bg-slate-900 text-slate-100 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-slate-700/80 flex flex-col h-[90vh] my-auto"
      >
        {/* Modal Top Bar */}
        <div className="bg-slate-950 p-4 sm:p-5 px-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">Java Spring Boot Architecture & Code Engine</h2>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  JDK 21 • Spring Boot 3.3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                REST APIs, Hibernate/JPA, MySQL DDL, JWT Security, OOP, Collections, Streams, Multithreading & GoF Design Patterns
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="bg-slate-900/90 px-6 pt-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-t-2 ${
              activeTab === 'concepts'
                ? 'bg-slate-850 text-amber-400 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Core Java & OOP Architecture
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-t-2 ${
              activeTab === 'code'
                ? 'bg-slate-850 text-amber-400 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Spring Boot Source Code Inspector ({JAVA_PROJECT_FILES.length} Files)
          </button>

          <button
            onClick={() => setActiveTab('api-tester')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-t-2 ${
              activeTab === 'api-tester'
                ? 'bg-slate-850 text-amber-400 border-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            REST API Swagger Workbench
          </button>
        </div>

        {/* Tab 1: Core Java Concepts & Design Patterns */}
        {activeTab === 'concepts' && (
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
            {/* Architectural Layering Diagram */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Spring Boot 3-Tier Enterprise Architecture
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Stateless REST + JWT</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  <div className="text-emerald-400 font-bold mb-1">1. REST Controllers</div>
                  <p className="text-[11px] text-slate-400">@RestController, @RequestMapping, @Valid DTO bindings, Swagger OpenAPI 3</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  <div className="text-amber-400 font-bold mb-1">2. Service & Patterns</div>
                  <p className="text-[11px] text-slate-400">Strategy Pattern pricing, Streams, Multithreading, @Transactional ACID logic</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  <div className="text-blue-400 font-bold mb-1">3. Spring Data JPA</div>
                  <p className="text-[11px] text-slate-400">Hibernate ORM, pessimistic locking, JPQL custom queries, entity lifecycle</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  <div className="text-purple-400 font-bold mb-1">4. MySQL Database</div>
                  <p className="text-[11px] text-slate-400">InnoDB, foreign key constraints, table indexes on status & plates</p>
                </div>
              </div>
            </div>

            {/* Core Java Concepts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OOP Principles */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm text-amber-400">1. Object-Oriented Programming (OOP)</h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li>• <strong className="text-white">Inheritance:</strong> All entities extend <code className="text-amber-300 font-mono">BaseAuditEntity</code> providing automatic createdAt and updatedAt timestamps.</li>
                  <li>• <strong className="text-white">Polymorphism:</strong> <code className="text-amber-300 font-mono">PricingStrategy</code> allows swapping rate algorithms dynamically without altering client callers.</li>
                  <li>• <strong className="text-white">Encapsulation:</strong> Private fields with Lombok getters/setters and isolated domain methods like <code className="text-amber-300 font-mono">vehicle.isRentable()</code>.</li>
                  <li>• <strong className="text-white">Abstraction:</strong> High-level service contracts like <code className="text-amber-300 font-mono">NotificationService</code> hide email/SMS transport protocols.</li>
                </ul>
              </div>

              {/* Design Patterns */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm text-amber-400">2. GoF Design Patterns Applied</h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li>• <strong className="text-white">Strategy Pattern:</strong> Calculates base rates, duration discounts (5%, 15%), and late return penalties dynamically.</li>
                  <li>• <strong className="text-white">Factory Pattern:</strong> <code className="text-amber-300 font-mono">VehicleFactory</code> instantiates category-specific subclasses (Sedan, Electric, Luxury).</li>
                  <li>• <strong className="text-white">Builder Pattern:</strong> <code className="text-amber-300 font-mono">Booking.builder()...build()</code> provides fluent construction of complex reservation models.</li>
                  <li>• <strong className="text-white">Singleton Pattern:</strong> Spring ApplicationContext manages singletons for <code className="text-amber-300 font-mono">JwtTokenProvider</code> and database connection pools.</li>
                </ul>
              </div>

              {/* Collections & Streams */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm text-emerald-400">3. Java Collections & Streams API</h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li>• <strong className="text-white">Functional Filtering:</strong> <code className="text-emerald-300 font-mono">vehicles.stream().filter(Vehicle::isRentable).collect(toList())</code></li>
                  <li>• <strong className="text-white">Grouping Collectors:</strong> Grouping total fleet revenue by category with <code className="text-emerald-300 font-mono">Collectors.groupingBy(Vehicle::getCategory, summingDouble(...))</code>.</li>
                  <li>• <strong className="text-white">Sorting:</strong> Sorting available vehicles by daily rate using <code className="text-emerald-300 font-mono">Comparator.comparing(Vehicle::getDailyRate)</code>.</li>
                </ul>
              </div>

              {/* Multithreading & Exceptions */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm text-emerald-400">4. Multithreading & Exception Handling</h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li>• <strong className="text-white">Multithreading / Cron:</strong> <code className="text-emerald-300 font-mono">@Scheduled(cron = "0 0 * * * ?")</code> hourly background worker detects overdue returns.</li>
                  <li>• <strong className="text-white">Asynchronous Concurrency:</strong> <code className="text-emerald-300 font-mono">CompletableFuture.runAsync(...)</code> handles email and receipt generation without blocking checkout threads.</li>
                  <li>• <strong className="text-white">Exception Handling:</strong> <code className="text-emerald-300 font-mono">@RestControllerAdvice</code> catches <code className="text-red-300 font-mono">VehicleUnavailableException</code> and returns RFC 7807 Problem Details.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Source Code Inspector */}
        {activeTab === 'code' && (
          <div className="flex-1 flex overflow-hidden">
            {/* File List Sidebar */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 p-3 space-y-1 overflow-y-auto shrink-0">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 py-1">Source Code Files</p>
              {JAVA_PROJECT_FILES.map((f) => (
                <button
                  key={f.filename}
                  onClick={() => setSelectedFile(f)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-colors flex flex-col ${
                    selectedFile.filename === f.filename
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="font-bold">{f.filename}</span>
                  <span className="text-[10px] text-slate-500">{f.category}</span>
                </button>
              ))}
            </div>

            {/* Code Content View */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              <div className="p-3 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-white">{selectedFile.filename}</span>
                  <p className="text-[11px] text-slate-400">{selectedFile.description}</p>
                </div>

                <button
                  onClick={() => handleCopyCode(selectedFile.code, selectedFile.filename)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {copiedFilename === selectedFile.filename ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="flex-1 p-4 text-[11px] font-mono leading-relaxed overflow-auto text-emerald-300 bg-slate-950">
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive REST API Console (Swagger style) */}
        {activeTab === 'api-tester' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Spring Boot REST API Swagger Console</h3>
                <p className="text-slate-400 text-xs">Test REST endpoints with simulated JWT Bearer authorization headers and inspect live responses.</p>
              </div>
            </div>

            {/* Endpoint Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setSelectedEndpoint('AVAILABLE_CARS');
                  handleExecuteApiTest('AVAILABLE_CARS');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedEndpoint === 'AVAILABLE_CARS'
                    ? 'border-emerald-500 bg-emerald-950/40 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">GET</span>
                <p className="font-mono text-[11px] font-bold mt-1">/api/v1/vehicles/available</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Filter by dates & category</p>
              </button>

              <button
                onClick={() => {
                  setSelectedEndpoint('CREATE_BOOKING');
                  handleExecuteApiTest('CREATE_BOOKING');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedEndpoint === 'CREATE_BOOKING'
                    ? 'border-amber-500 bg-amber-950/40 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">POST</span>
                <p className="font-mono text-[11px] font-bold mt-1">/api/v1/bookings</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Create & apply Strategy</p>
              </button>

              <button
                onClick={() => {
                  setSelectedEndpoint('PROCESS_RETURN');
                  handleExecuteApiTest('PROCESS_RETURN');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedEndpoint === 'PROCESS_RETURN'
                    ? 'border-blue-500 bg-blue-950/40 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded">POST</span>
                <p className="font-mono text-[11px] font-bold mt-1">/api/v1/bookings/return</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Late return calculation</p>
              </button>

              <button
                onClick={() => {
                  setSelectedEndpoint('LOGIN');
                  handleExecuteApiTest('LOGIN');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedEndpoint === 'LOGIN'
                    ? 'border-purple-500 bg-purple-950/40 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span className="text-[10px] font-bold text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded">POST</span>
                <p className="font-mono text-[11px] font-bold mt-1">/api/v1/auth/login</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Generate JWT token</p>
              </button>
            </div>

            {/* Request Headers & Authorization Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div className="text-white font-bold mb-1">Request Headers:</div>
              <div>Content-Type: application/json</div>
              <div className="text-amber-400">Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGV4... (JWT Token)</div>
            </div>

            {/* Live Response Panel */}
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[11px] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="font-bold text-white">Live Spring Boot JSON Response:</span>
                <button
                  onClick={() => handleExecuteApiTest(selectedEndpoint)}
                  disabled={isLoadingApi}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {isLoadingApi ? 'Invoking...' : 'Re-Execute Call'}
                </button>
              </div>

              {isLoadingApi ? (
                <div className="text-slate-500 py-6 text-center">Dispatching HTTP request to Spring Boot controller...</div>
              ) : (
                <pre className="text-emerald-300 overflow-auto flex-1">
                  <code>{apiResponse || 'Select an endpoint above to execute a live REST request.'}</code>
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
