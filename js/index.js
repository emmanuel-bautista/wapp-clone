// login del usuario
let username;
const button = document.getElementById('btnsubmit');

let login = false;
let avatarUrl;
let socket = null;
let userInfo = null;
let currentContact = null;
let connectedUsers = [];


// limpiar session storage
sessionStorage.clear();

// mostrar pantalla de login
const loginScreen = () => {
    if (socket) {
        socket.close()
    }
    document.getElementById('main-container').classList.add('d-none');
    button.addEventListener('click', async () => {
        username = document.getElementById('username').value;
        if (username.trim() === '') return;

        username = username.replace(/ /g, "+");
        const data = await fetch(`https://ui-avatars.com/api/?name=${username}&background=random`);
        avatarUrl = data.url;
        chatScreen();
    });

}

// mostrar pantalla de chat
const chatScreen = () => {
    // listar los mensajes
    const showMessages = (user) => {
        // eliminar los mensajes
        document.getElementById('messages').innerHTML = null;
        if (sessionStorage.getItem(user)) {
            JSON.parse(sessionStorage.getItem(user)).forEach(m => {
                    
                    if (m.msg.type === 'text') {
                        document.getElementById('messages').innerHTML +=
                        `<div class="row d-flex ${user !== m.user ? 'justify-content-end' : ''}">
                                <div class="col-6">
                                    <div class="alert ${user !== m.user ? 'alert-primary bg-green-secondary' : 'alert-secondary dark-secondary'}" role="alert">
                                        <p>${m.msg.msg}</p>
                                        <div class="w-100 d-flex justify-content-end">
                                            <span class="text-white">${m.msg.hour}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>`
                        ;
                    } else if (m.msg.type === 'location'){
                        var img_url = "https://maps.googleapis.com/maps/api/staticmap" +
                        "?center=" + m.msg.msg.lat + "," + m.msg.msg.lng +
                        "&zoom=14" +
                        "&size=400x300" +
                        "&key=AIzaSyCv9VAsM4KzjDdvuV2CzFAMuazqOfqFlgM";

                        document.getElementById('messages').innerHTML +=
                        `<div class="row d-flex ${user !== m.user ? 'justify-content-end' : ''}">
                                <div class="col-6">
                                    <div class="alert ${user !== m.user ? 'alert-primary bg-green-secondary' : 'alert-secondary dark-secondary'}" role="alert">
                                        <img src="${img_url}" class="img-fluid"/>
                                        <div class="w-100 d-flex justify-content-end">
                                            <span class="text-white">${m.msg.hour}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>`
                        ;
                    }
                
                
            })
        }
    }

    // enviar mensajes
    const sendMessage = (user, type, message, hour) => {

        if (type==='text') {
            if (message.trim() === '') return;
        }
        

        const aux = sessionStorage.getItem(user) ? JSON.parse(sessionStorage.getItem(user)) : [];
        sessionStorage.removeItem(user);
        aux.push({
            user: userInfo.id,
            msg: {
                type,
                msg: message,
                hour
            }
        });
        updateScroll();

        sessionStorage.setItem(user, JSON.stringify(aux));
       
        document.getElementById('msjEnviar').value = "";

        socket.emit('pmsg', user, {
            type,
            msg: message,
            user: userInfo,
            hour
        });
    }

    // mostrar los usuarios conectados
    const listUsers = (data) => {
        let usuarios = data.filter(u => u.id !== userInfo.id);
        document.getElementById('contactList').innerHTML = null;
        
        usuarios.forEach(u => {
            document.getElementById('contactList').innerHTML +=
                `<li class="d-flex mt-3 p-3" id=${u.id}>
                    <img src="${u.avatar}" alt="" class="contact-img" data-user=${u.id} data-name=${u.username}>
                    <div class="contact" data-user=${u.id}>
                        <p class="p-0 m-0 fw-bold text-white">${u.username}</p>
                    </div>
                </li>`;
            }
        );

        document.querySelectorAll('.contact').forEach(i => {
            i.addEventListener('click', (e) => {
                document.getElementById('blank-section').classList.add('d-none');
                document.getElementById('chat-section').classList.remove('d-none');
                // quitar el color de notificación
                document.getElementById(i.dataset.user).classList.remove('bg-notification');
                currentContact = i.dataset.user;
                // mostrar nombre y avatar en el navbar
                document.querySelectorAll('.contact-img').forEach(img => {
                    if (img.dataset.user === i.dataset.user) {
                        document.getElementById('chat-avatar').src = img.src;
                        document.getElementById('chat-username').innerHTML = null;
                        document.getElementById('chat-username').innerHTML = img.dataset.name;
                    }
                });


                // mostrar mensajes anteriores
                showMessages(i.dataset.user);

                // enviar un mensaje
                document.getElementById('btnEnviar').onclick = () => {
                    const message = document.getElementById('msjEnviar').value;
                    sendMessage(i.dataset.user, 'text', message, moment().format('HH:mm'));
                    showMessages(i.dataset.user);
                }

                document.getElementById('msjEnviar').onkeyup = (e) => {
                    const message = document.getElementById('msjEnviar').value;
                    if (e.key === 'Enter') {
                        sendMessage(i.dataset.user, 'text', message, moment().format('HH:mm'));
                        showMessages(i.dataset.user);
                    }
                }

                //boton obtener ubicación
                document.getElementById('btnEnviarUbicacion').onclick = () => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(pos => {
                          let ubicacion={
                              lat:pos.coords.latitude,
                              lng:pos.coords.longitude
                          }
                          console.log(JSON.stringify(ubicacion));
                          sendMessage(i.dataset.user,'location',ubicacion, moment().format('HH:mm'));
                          showMessages(i.dataset.user);
                        }, err)
                    }
                }
                function err(error) {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            txtLocalizacion.innerHTML = "No tienes permisos de acceder a la geolocalizacion";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            txtLocalizacion.innerHTML = "No se pudo acceder a la geolicalización";
                            break;
                        case error.TIMEOUT:
                            txtLocalizacion.innerHTML = "El tiempo de respuesta se agoto";
                        case error.UKNOWN:
                            txtLocalizacion.innerHTML = "desconocido";
                        default:
                            txtLocalizacion.innerHTML = "a ocurrido un error";
                    }
                }

            })
        })
    }

    

    // hacer visible el chat y ocultr el login
    document.getElementById('login-container').classList.add('d-none');
    document.getElementById('main-container').classList.remove('d-none');

    // mostrar avatar y nombre de usuario
    document.getElementById('self-img').src = avatarUrl;
    const textUser = document.createTextNode(username);
    document.getElementById('usernametext').appendChild(textUser);

    // instanciar socket perrón 
    socket = io('https://ws-clone.herokuapp.com');

    // enviar usuario
    socket.emit('username', {
        username: username,
        avatar: avatarUrl
    });

    // escuchar a los usuarios que se conectan
    socket.on('connected', (data) => {
        listUsers(data);
        connectedUsers = data;
    });


    // eventos de los sockets
    socket.on('userout', (data) => {
        socket.emit('username', {
            username: username,
            avatar: avatarUrl
        });
    });

    socket.on('username', (data) => {
        userInfo = data;
        listUsers(data.users);
        connectedUsers = data.users;
    });

    socket.on('pmsg', (socketId, msg) => {
        updateScroll();
        const aux = sessionStorage.getItem(socketId) ? JSON.parse(sessionStorage.getItem(socketId)) : [];
        sessionStorage.removeItem(socketId);
        aux.push({
            user: socketId,
            msg
        });
        sessionStorage.setItem(socketId, JSON.stringify(aux));
        if (currentContact === socketId) {
            showMessages(socketId);
        } else {
            
            document.getElementById(socketId).classList.add('bg-notification');
            if (!('Notification' in window)) {
                alert('Tu navegador no soporta las notificaciones');
            }
            else if (Notification.permission === 'granted') {
                const notification = new Notification('Nuevo mensaje');
            }
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {
                    if (permission === "granted") {
                        var notification = new Notification("Notificaciones permitidas");
                    }
                });
            }
        }
    });
}

loginScreen();

function updateScroll(event){
    let messages = document.getElementById('messages');
    // messages.scrollIntoView(false);
    messages.scrollTop = messages.scrollHeight - 148// - (messages.clientHeight - 120);
}