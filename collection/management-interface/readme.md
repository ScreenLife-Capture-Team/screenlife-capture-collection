# ScreenLife Capture Management Interface

## Purpose
The management interface was designed to allow for the reliable and convenient management of data collection using the Screenlife Capture app. The management interface is intended to run on a management device locally.

## Project Structure

### 1. Server (Node.js, Koa, FeathersJS App Created in TypeScript)
The server component of the platform is built using Node.js and leverages several frameworks and technologies to ensure robustness and maintainability. Specifically, it employs Koa.js and FeathersJS, both integrated into a TypeScript environment for enhanced type safety and modern JavaScript development practices.

- **Node.js**: As the runtime environment, Node.js allows the server to execute JavaScript code outside of a web browser, facilitating server-side operations and communication.
- **Koa.js**: Koa.js is utilized as the web framework for Node.js, providing a minimalist and expressive middleware for building efficient web applications and APIs. Its lightweight nature and modular design make it ideal for handling HTTP requests and responses.
- **FeathersJS**: FeathersJS is integrated into the server to streamline the development of real-time applications. It offers a set of tools and patterns for building robust API services and integrates well with various databases and authentication methods.
- **TypeScript**: The entire server-side codebase is written in TypeScript, a superset of JavaScript that adds static typing and other advanced features to the language. TypeScript helps catch errors early in the development process and enhances code maintainability through type annotations and interfaces.

### 2. WebApp (Next.js)
The web application component of the platform is developed using Next.js, a React framework that optimizes the building of server-side rendered (SSR) and statically generated React applications.

- **Next.js**: Next.js simplifies the creation of React applications by providing features such as server-side rendering, automatic code splitting, and simplified routing. It optimizes performance by pre-rendering pages and serving them as static HTML, where possible, while allowing dynamic functionalities when needed.
- **React**: Next.js builds upon React, a popular JavaScript library for building user interfaces. React's component-based architecture and declarative syntax enable developers to create interactive UIs efficiently.

## Setup

Please refer to the server and webapp folders for instructions on how to setup each component of the platform.