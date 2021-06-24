# RayTracingCPP
A simple ray tracing engine which I made from scratch using OpenGL and C++. This repository contains only the source code and the executable file. The src folder with the two shaders are required for the executable to run. The window can be resized without causing any problems to this program, and the default number of reflections per light ray is 11 (12 including the initial casting of the light ray). This can be adjusted by changing the upper bound of the for loop on line 302 in the fragment shader (a lower number of reflections should increase the framerate of the application).
