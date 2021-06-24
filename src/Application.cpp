#include <GL/glew.h>
#include <GLFW/glfw3.h>
//#include "Graphics2D.h"

#include <string>
#include <iostream>
#include <fstream>
//#include <ofstream>

using namespace std;

int createShaderProgram(unsigned int &shaderProgram, const char* vertexPath, const char* fragmentPath) { //returns -1 if an error has occured, 0 otherwise
    const char* vertexShaderSource;
    const char* fragmentShaderSource;
    string vertexCode;
    string fragmentCode;
    ifstream vertexFile;
    ifstream fragmentFile;

    //read shader code from memory
    try {
        string current;
        vertexFile.open(vertexPath);
        while (getline(vertexFile, current)) {
            vertexCode += current + "\n";
        }
        vertexShaderSource = vertexCode.c_str();
        vertexFile.close();

        fragmentFile.open(fragmentPath);
        while (getline(fragmentFile, current)) {
            fragmentCode += current + "\n";
        }
        fragmentShaderSource = fragmentCode.c_str();
        fragmentFile.close();
    }
    catch (ifstream::failure e) {
        cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << endl;
        return -1;
    }

    unsigned int vertexShader;
    vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
    glCompileShader(vertexShader);

    //THE FOLLOWING DETERMINES IF THE VERTEX SHADER WAS COMPILED SUCCESSFULLY
    int success;
    char infoLog[512];
    glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
        return -1;
    }


    unsigned int fragmentShader;
    fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
    glCompileShader(fragmentShader);

    //THE FOLLOWING DETERMINES IF THE FRAGMENT SHADER WAS COMPILED SUCCESSFULLY
    glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
        return -1;
    }

    //THE FOLLOWING CREATES AND COMPILES THE SHADER PROGRAM
    shaderProgram = glCreateProgram();

    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    glLinkProgram(shaderProgram);

    glDeleteShader(vertexShader); //no longer needed as they have been bound to the program, and the program has been bound to OpenGL
    glDeleteShader(fragmentShader);

    return 0;
}

int aspectRatioLocation;
void framebuffer_size_callback(GLFWwindow* window, int width, int height) {
    glViewport(0, 0, width, height);
    glUniform1f(aspectRatioLocation, (float)width / height);
}

int main() {

    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(800, 800, "RayTracing Demo", NULL, NULL);
    if (window == NULL) {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback); //when window size changes call this function

    glewInit();

    glClearColor(0.2, 0.3, 0.3, 1);

    unsigned int shaderProgram;
    createShaderProgram(shaderProgram, "src/VertexShader.vert", "src/FragmentShader.frag");

    float quadVertices[] = {
        -1.0f, -1.0f, 0, //bl
        -1.0f, 1.0f, 0, //tl
        1.0f, 1.0f, 0, //tr
        1.0f, -1.0f, 0 //br
    };
    int quadIndices[] = {
        0, 1, 2,
        2, 3, 0
    };


    //THE FOLLOWING INITIALISES THE VBO
    unsigned int VBO;
    glGenBuffers(1, &VBO);

    //THE FOLLOWING INITIALISES THE VAO
    unsigned int VAO;
    glGenVertexArrays(1, &VAO);

    //THE FOLLOWING INITIALISES THE EBO
    unsigned int EBO;
    glGenBuffers(1, &EBO);

    //THE FOLLOWING LOADS THE VERTEX DATA INTO THE VAO, AND VBO, HENCE THE PROGRAM - INITIALISATION CODE - ONLY NEEDS TO BE RUN ONCE UNLESS DATA CHANGES

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices), quadVertices, GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(quadIndices), quadIndices, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0); //3 values per point
    glEnableVertexAttribArray(0);


    glUseProgram(shaderProgram);


    int dLocation = glGetUniformLocation(shaderProgram, "d");
    aspectRatioLocation = glGetUniformLocation(shaderProgram, "aspectRatio");
    glUniform1f(aspectRatioLocation, 1);
    int playerPosLocation = glGetUniformLocation(shaderProgram, "playerPos");
    int playerRotLocation = glGetUniformLocation(shaderProgram, "playerRot");
    float playerPos[] = {0, 0, 0};
    float forward[] =   {0, 1}; //x, z
    float right[] =     {1, 0}; //x, y
    float playerRot[] = {0, 0}; //rot about x axis, rot about y axis
    glUniform1f(dLocation, 1 / tan((50 / 2) * (3.1415 / 180))); //d = aspectRatio / tan(fov / 2)
    while (!glfwWindowShouldClose(window)) {
        //rotation in x axis followed by rotation in y axis
        if(glfwGetKey(window, GLFW_KEY_UP)) {
            playerRot[0] += 0.01;
            if (playerRot[0] > 1.5) {
                playerRot[0] = 1.5;
            }
        }
        if (glfwGetKey(window, GLFW_KEY_DOWN)) {
            playerRot[0] -= 0.01;
            if (playerRot[0] < -1.5) {
                playerRot[0] = -1.5;
            }
        }
        if (glfwGetKey(window, GLFW_KEY_RIGHT)) {
            playerRot[1] -= 0.01;
        }
        if (glfwGetKey(window, GLFW_KEY_LEFT)) {
            playerRot[1] += 0.01;
        }
        forward[0] = -sin(playerRot[1]);
        forward[1] = cos(playerRot[1]);
        right[0] = cos(playerRot[1]);
        right[1] = sin(playerRot[1]);
        
        if (glfwGetKey(window, GLFW_KEY_W)) {
            playerPos[0] += 0.01 * forward[0];
            playerPos[2] += 0.01 * forward[1];
        }
        if (glfwGetKey(window, GLFW_KEY_S)) {
            playerPos[0] -= 0.01 * forward[0];
            playerPos[2] -= 0.01 * forward[1];
        }
        if (glfwGetKey(window, GLFW_KEY_D)) {
            playerPos[0] += 0.01 * right[0];
            playerPos[2] += 0.01 * right[1];
        }
        if (glfwGetKey(window, GLFW_KEY_A)) {
            playerPos[0] -= 0.01 * right[0];
            playerPos[2] -= 0.01 * right[1];
        }
        if (glfwGetKey(window, GLFW_KEY_SPACE)) {
            playerPos[1] += 0.01;
        }
        if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT)) {
            playerPos[1] -= 0.01;
        }
        if (glfwGetKey(window, GLFW_KEY_ESCAPE)) {
            glfwSetWindowShouldClose(window, true);
        }

        glClear(GL_COLOR_BUFFER_BIT); //CLEAR - READY TO START RENDERING

        glUniform3f(playerPosLocation, playerPos[0], playerPos[1], playerPos[2]);
        glUniform2f(playerRotLocation, playerRot[0], playerRot[1]);
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

        //END OF RENDER LOOP
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    //EXIT
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}