# GourmetGoApp - Aplicación de Experiencias Culinarias

GourmetGoApp es una aplicación móvil desarrollada con React Native y Expo que conecta a chefs con usuarios para ofrecer experiencias culinarias únicas.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 14 o superior)
- [npm](https://www.npmjs.com/) (normalmente viene con Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Git](https://git-scm.com/downloads)

## Configuración del Proyecto

### 1. Clonar el Repositorio

```bash
git clone https://github.com/JoseZum/GourmetGo/tree/main/GourmetGoApp
cd GourmetGoApp
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Firebase

Esta aplicación utiliza Firebase para autenticación, base de datos y almacenamiento. Necesitarás crear un proyecto en Firebase y configurar las credenciales:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication, Firestore Database y Storage
3. Crea un archivo `firebase/config.js` con tus credenciales:

```javascript
export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

## Ejecutar la Aplicación

### Desarrollo Local

```bash
npx expo start
```

Esto iniciará el servidor de desarrollo de Expo. Puedes ejecutar la aplicación en:

- **Dispositivo físico**: Escanea el código QR con la app Expo Go (Android / iOS)
- **Emulador Android**: Presiona `a` en la terminal o selecciona "Run on Android device/emulator"
- **Simulador iOS**: Presiona `i` en la terminal o selecciona "Run on iOS simulator"
- **Web**: Presiona `w` en la terminal o selecciona "Run in web browser"

### Comandos Adicionales

```bash
# Iniciar específicamente para Android
npm run android

# Iniciar específicamente para iOS
npm run ios

# Iniciar específicamente para web
npm run web

# Ejecutar linting
npm run lint
```

## Estructura del Proyecto

```
GourmetGoApp/
├── assets/            # Imágenes, fuentes y otros recursos estáticos
├── components/        # Componentes reutilizables
├── constants/         # Constantes y temas
├── firebase/          # Configuración y funciones de Firebase
├── hooks/             # Custom hooks
├── screens/           # Pantallas de la aplicación
│   ├── auth/          # Pantallas de autenticación
│   ├── chef/          # Pantallas específicas para chefs
│   ├── common/        # Pantallas comunes
│   └── user/          # Pantallas específicas para usuarios
├── utils/             # Funciones de utilidad
└── App.js             # Punto de entrada principal
```

## Funcionalidades Principales

- **Autenticación**: Registro e inicio de sesión para usuarios y chefs
- **Exploración**: Búsqueda y filtrado de experiencias culinarias
- **Reservas**: Sistema de reservas con generación de códigos QR
- **Gestión para Chefs**: Creación y administración de experiencias culinarias
- **Calificaciones**: Sistema de valoraciones para experiencias
- **Chatbot**: FAQ interactivo para resolver dudas comunes

## Solución de Problemas

### Error al iniciar la aplicación

Si encuentras problemas al iniciar la aplicación, intenta:

```bash
# Limpiar caché
npx expo start --clear

# Reiniciar el servidor de Metro
npx expo start -c
```

### Problemas con las dependencias

Si hay problemas con las dependencias:

```bash
# Reinstalar node_modules
rm -rf node_modules
npm install
```

## Contribuir al Proyecto

1. Crea un fork del repositorio
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo MIT License.