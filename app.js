// app.js - Versión limpia sin código de conexión lenta

function App() {
    const [showWelcome, setShowWelcome] = React.useState(true);
    const [bookingData, setBookingData] = React.useState({
        service: null,
        date: null,
        time: null,
        confirmedBooking: null
    });
    const [showForm, setShowForm] = React.useState(false);

    const handleServiceSelect = (service) => {
        setBookingData(prev => ({ ...prev, service, time: null }));
    };

    const handleDateSelect = (date) => {
        setBookingData(prev => ({ ...prev, date, time: null }));
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
            date: null,
            time: null,
            confirmedBooking: null
        });
        setShowForm(false);
    };

    if (showWelcome) {
        return (
            <div data-name="app-container">
                <WelcomeScreen onStart={() => setShowWelcome(false)} />
                <WhatsAppButton />
            </div>
        );
    }

    if (bookingData.confirmedBooking) {
        return (
            <div className="min-h-screen bg-[#faf8f7] flex flex-col" data-name="app-container">
                <Header />
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
            <Header />
            
            <main className="flex-grow p-4 space-y-8 max-w-3xl mx-auto w-full">
                {/* Step 1: Service */}
                <ServiceSelection 
                    selectedService={bookingData.service} 
                    onSelect={handleServiceSelect} 
                />

                {/* Step 2: Calendar - Show only after service is selected */}
                {bookingData.service && (
                    <Calendar 
                        selectedDate={bookingData.date} 
                        onDateSelect={handleDateSelect} 
                    />
                )}

                {/* Step 3: Time Slots - Show only after date is selected */}
                {bookingData.service && bookingData.date && (
                    <TimeSlots 
                        service={bookingData.service} 
                        date={bookingData.date}
                        selectedTime={bookingData.time}
                        onTimeSelect={handleTimeSelect}
                    />
                )}
            </main>

            {/* Modal Form */}
            {showForm && (
                <BookingForm 
                    service={bookingData.service}
                    date={bookingData.date}
                    time={bookingData.time}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setShowForm(false)}
                />
            )}
            
            {/* Reset Button */}
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