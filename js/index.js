// login del usuario
let username;
const button = document.getElementById('btnsubmit');

let login = false;
let avatarUrl;
let socket = null;
let userInfo = null;
let currentContact = null;

// limpiar session storage
sessionStorage.clear();

// mostrar pantalla de login
const loginScreen = () => {
    if (socket) {
        socket.close()
    }
    document.getElementById('main-container').classList.add('d-none');
    button.addEventListener('click', async (e) => {
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
                document.getElementById('messages').innerHTML +=
                    `<div class="row d-flex ${user !== m.user ? 'justify-content-end' : ''}">
                            <div class="col-6">
                                <div class="alert ${user !== m.user ? 'alert-primary' : 'alert-secondary'}" role="alert">
                                    ${m.msg.msg}
                                </div>
                            </div>
                        </div>`
                    ;
            })
        }
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
                        <p class="p-0 m-0 text-muted border-bottom pb-2 border-secondary">Lorem ipsum dolor sit amet consectetur.</p>
                    </div>
                </li>`;
        });

        document.querySelectorAll('.contact').forEach(i => {
            i.addEventListener('click', (e) => {
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

                    if (message.trim() === '') return;

                    const aux = sessionStorage.getItem(i.dataset.user) ? JSON.parse(sessionStorage.getItem(i.dataset.user)) : [];
                    sessionStorage.removeItem(i.dataset.user);
                    aux.push({
                        user: userInfo.id,
                        msg: {
                            type: 'text',
                            msg: message
                        }
                    });

                    sessionStorage.setItem(i.dataset.user, JSON.stringify(aux));

                    document.getElementById('messages').innerHTML +=
                        `<div class="row d-flex justify-content-end">
                            <div class="col-6">
                                <div class="alert alert-primary" role="alert">
                                    ${message}
                                </div>
                            </div>
                        </div>`
                        ;
                    document.getElementById('msjEnviar').value = "";

                    socket.emit('pmsg', i.dataset.user, {
                        type: 'text',
                        msg: message,
                        user: userInfo
                    });
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
    socket = io('http://localhost:3000');

    // enviar usuario
    socket.emit('username', {
        username: username,
        avatar: avatarUrl
    });

    // escuchar a los usuarios que se conectan
    socket.on('connected', (data) => {
        listUsers(data);
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
    });

    socket.on('pmsg', (socketId, msg) => {
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
