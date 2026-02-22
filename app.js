// app.js - Versión con selección de trabajador primero

function App() {
    const [showWelcome, setShowWelcome] = React.useState(true);
    const [clienteAutorizado, setClienteAutorizado] = React.useState(null);
    const [bookingData, setBookingData] = React.useState({
        service: null,
        worker: null,
        date: null,
        time: null,
        confirmedBooking: null
    });
    const [showForm, setShowForm] = React.useState(false);

    React.useEffect(() => {
        const savedCliente = localStorage.getItem('cliente_autorizado');
        if (savedCliente) {
            try {
                const cliente = JSON.parse(savedCliente);
                if (window.verificarAccesoCliente && window.verificarAccesoCliente(cliente.whatsapp)) {
                    setClienteAutorizado(cliente);
                } else {
                    localStorage.removeItem('cliente_autorizado');
                }
            } catch (e) {
                localStorage.removeItem('cliente_autorizado');
            }
        }
    }, []);

    const scrollToSection = (sectionId) => {
        setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
                const yOffset = -80;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleAccessGranted = (nombre, whatsapp) => {
        const cliente = { nombre, whatsapp };
        setClienteAutorizado(cliente);
        localStorage.setItem('cliente_autorizado', JSON.stringify(cliente));
        setShowWelcome(false);
    };

    // 🔥 NUEVO ORDEN: Servicio → Trabajador → Fecha → Hora
    const handleServiceSelect = (service) => {
        setBookingData(prev => ({ 
            ...prev, 
            service, 
            worker: null,
            date: null,
            time: null
        }));
        scrollToSection('worker-section');
    };

    const handleWorkerSelect = (worker) => {
        setBookingData(prev => ({ 
            ...prev, 
            worker, 
            date: null,
            time: null
        }));
        scrollToSection('calendar-section');
    };

    const handleDateSelect = (date) => {
        setBookingData(prev => ({ 
            ...prev, 
            date, 
            time: null
        }));
        scrollToSection('timeslots-section');
    };

    const handleTimeSelect = (time) => {
        setBookingData(prev => ({ ...prev, time }));
        setShowForm(true);
    };

    const handleFormSubmit = (finalBooking) => {
        setShowForm(false);
        setBookingData(prev => ({ ...prev, confirmedBooking: finalBooking }));
    };

    const resetBooking = () => {
        setBookingData({
            service: null,
            worker: null,
            date: null,
            time: null,
            confirmedBooking: null
        });
        setShowForm(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLogout = () => {
        localStorage.removeItem('cliente_autorizado');
        setClienteAutorizado(null);
        setShowWelcome(true);
    };

    if (!clienteAutorizado) {
        return <ClientAuthScreen onAccessGranted={handleAccessGranted} />;
    }

    if (showWelcome) {
        return (
            <div data-name="app-container">
                <WelcomeScreen onStart={() => setShowWelcome(false)} cliente={clienteAutorizado} />
                <WhatsAppButton />
            </div>
        );
    }

    if (bookingData.confirmedBooking) {
        return (
            <div className="min-h-screen bg-[#faf8f7] flex flex-col" data-name="app-container">
                <Header cliente={clienteAutorizado} onLogout={handleLogout} />
                <main className="flex-grow p-4">
                    <div className="max-w-xl mx-auto">
                        <Confirmation booking={bookingData.confirmedBooking} onReset={resetBooking} />
                    </div>
                </main>
                <WhatsAppButton />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf8f7] flex flex-col pb-20" data-name="app-container">
            <Header cliente={clienteAutorizado} onLogout={handleLogout} />
            
            <main className="flex-grow p-4 space-y-8 max-w-4xl mx-auto w-full">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="icon-check-circle text-green-600"></div>
                        <span className="text-sm text-green-700">
                            Bienvenida, <strong>{clienteAutorizado.nombre}</strong>
                        </span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                        title="Salir"
                    >
                        <div className="icon-log-out"></div>
                    </button>
                </div>

                {/* 🔥 PASO 1: Servicio */}
                <div id="service-section">
                    <ServiceSelection 
                        selectedService={bookingData.service} 
                        onSelect={handleServiceSelect} 
                    />
                </div>

                {/* 🔥 PASO 2: Trabajador (solo si hay servicio) */}
                {bookingData.service && (
                    <div id="worker-section">
                        <WorkerSelection 
                            selectedWorker={bookingData.worker} 
                            onSelect={handleWorkerSelect} 
                        />
                    </div>
                )}

                {/* 🔥 PASO 3: Calendario (solo si hay servicio y trabajador) */}
                {bookingData.service && bookingData.worker && (
                    <div id="calendar-section">
                        <Calendar 
                            selectedDate={bookingData.date} 
                            onDateSelect={handleDateSelect}
                            worker={bookingData.worker}
                        />
                    </div>
                )}

                {/* 🔥 PASO 4: Horarios (solo si hay servicio, trabajador y fecha) */}
                {bookingData.service && bookingData.worker && bookingData.date && (
                    <div id="timeslots-section">
                        <TimeSlots 
                            service={bookingData.service} 
                            date={bookingData.date}
                            worker={bookingData.worker}
                            selectedTime={bookingData.time}
                            onTimeSelect={handleTimeSelect}
                        />
                    </div>
                )}
            </main>

            {showForm && (
                <BookingForm 
                    service={bookingData.service}
                    worker={bookingData.worker}
                    date={bookingData.date}
                    time={bookingData.time}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setShowForm(false)}
                    cliente={clienteAutorizado}
                />
            )}
            
            {(bookingData.service || bookingData.date) && (
                <div className="fixed bottom-24 right-6 z-40">
                    <button 
                        onClick={resetBooking}
                        className="bg-white text-gray-600 shadow-lg border border-gray-200 rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <div className="icon-rotate-ccw text-xs"></div>
                        Reiniciar
                    </button>
                </div>
            )}

            <WhatsAppButton />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);