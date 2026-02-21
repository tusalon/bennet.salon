// components/ClientAuthScreen.js - VERSIÓN DEBUG

function ClientAuthScreen({ onAccessGranted }) {
    const [nombre, setNombre] = React.useState('');
    const [whatsapp, setWhatsapp] = React.useState('');
    const [solicitudEnviada, setSolicitudEnviada] = React.useState(false);
    const [error, setError] = React.useState('');
    const [clienteAutorizado, setClienteAutorizado] = React.useState(null);

    React.useEffect(() => {
        console.log('🔄 Estado clienteAutorizado actualizado:', clienteAutorizado);
    }, [clienteAutorizado]);

    const verificarNumero = (numero) => {
        console.log('='.repeat(50));
        console.log('🔍 VERIFICAR NÚMERO:', numero);
        
        if (numero.length >= 8) {
            const numeroLimpio = numero.replace(/\D/g, '');
            const numeroCompleto = `53${numeroLimpio}`;
            
            console.log('📞 Número a verificar:', numeroCompleto);
            console.log('🧩 window.verificarAccesoCliente:', typeof window.verificarAccesoCliente);
            
            if (window.verificarAccesoCliente) {
                const existe = window.verificarAccesoCliente(numeroCompleto);
                console.log('🔎 Resultado búsqueda:', existe);
                
                if (existe) {
                    console.log('✅ CLIENTE AUTORIZADO ENCONTRADO:', existe);
                    setClienteAutorizado(existe);
                    setError('');
                } else {
                    console.log('❌ CLIENTE NO AUTORIZADO');
                    setClienteAutorizado(null);
                }
            } else {
                console.error('❌ verificarAccesoCliente NO EXISTE');
            }
        } else {
            console.log('⏳ Número corto, limpiando...');
            setClienteAutorizado(null);
        }
        console.log('='.repeat(50));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('📝 HANDLE SUBMIT');
        
        if (!nombre.trim() || !whatsapp.trim()) {
            setError('Completá todos los campos');
            return;
        }
        
        const numeroLimpio = whatsapp.replace(/\D/g, '');
        const numeroCompleto = `53${numeroLimpio}`;
        
        if (clienteAutorizado) {
            console.log('✅ Acceso directo para:', clienteAutorizado);
            onAccessGranted(clienteAutorizado.nombre, numeroCompleto);
            return;
        }
        
        if (window.isClientePendiente && window.isClientePendiente(numeroCompleto)) {
            setError('Ya tenés una solicitud pendiente.');
            return;
        }
        
        if (window.agregarClientePendiente) {
            const agregado = window.agregarClientePendiente(nombre, numeroCompleto);
            if (agregado) {
                setSolicitudEnviada(true);
                setError('');
            } else {
                setError('Error al enviar la solicitud.');
            }
        }
    };

    const handleAccesoDirecto = () => {
        if (clienteAutorizado) {
            const numeroLimpio = whatsapp.replace(/\D/g, '');
            const numeroCompleto = `53${numeroLimpio}`;
            onAccessGranted(clienteAutorizado.nombre, numeroCompleto);
        }
    };

    // ... (resto del JSX igual)
}