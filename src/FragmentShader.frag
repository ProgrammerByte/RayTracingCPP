//EQUATION OF CONE: (x - a)^2 + (z - c)^2 = (r(1 - (y - yMin)/(yMax - yMin)))^2

#version 330 core
precision highp float;
in vec3 pos;
out vec4 FragColor;
uniform float aspectRatio;
uniform float d;
uniform vec3 playerPos;
uniform vec2 playerRot;

void reflectRay(inout vec3 rayDir, in vec3 normal);
void reflectRay(inout vec3 rayDir, in vec3 normal) {
	vec3 pn = normalize(cross(cross(rayDir, normal), normal)); //normal to plane
	rayDir = -rayDir;
	rayDir -= 2 * dot(pn, rayDir) * pn;
}

void rayVsSphere(in vec4 sphere, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity); //for some reason normal must be inout
void rayVsSphere(in vec4 sphere, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity) {
	float nextDist;
	vec3 terms = rayPos - sphere.xyz;
	float a = dot(rayDir, rayDir);
	float b = 2 * dot(rayDir, terms);
	float c = dot(terms, terms) - (sphere.w * sphere.w);
	float discriminant = b * b - 4 * a * c;
	if (discriminant >= 0) {
		discriminant = sqrt(discriminant) / (2 * a);
		float first = -b / (2 * a);
		nextDist = first - discriminant;
		if (nextDist > 0.0001) {
			if (nextDist < minDist) {
				minDist = nextDist;
				normal = normalize(rayPos + (nextDist * rayDir) - sphere.xyz);
				reflectivity = newReflectivity;
				color = newColor;
			}
		}
		/*else {
			nextDist += 2 * discriminant;
			if (nextDist > 0.0001 && nextDist < minDist) {
				minDist = nextDist;
				normal = normalize(rayPos + (nextDist * rayDir) - sphere.xyz);
				reflectivity = newReflectivity;
				color = newColor;
			}
		}*/
	}
}

//axis aligned (corners define box)
void rayVsBox(in vec3 small, in vec3 large, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity);
void rayVsBox(in vec3 small, in vec3 large, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity) {
	vec3 maxLambda = (large - rayPos) / rayDir;
	vec3 minLambda = (small - rayPos) / rayDir;
	float temp;
	if (rayDir.x < 0) {
		temp = maxLambda.x;
		maxLambda.x = minLambda.x;
		minLambda.x = temp;
	}
	if (rayDir.y < 0) {
		temp = maxLambda.y;
		maxLambda.y = minLambda.y;
		minLambda.y = temp;
	}
	if (rayDir.z < 0) {
		temp = maxLambda.z;
		maxLambda.z = minLambda.z;
		minLambda.z = temp;
	}
	float lb = minLambda.x; //lower bound
	int lbIndex = 0; //Which axis the ray may reflect in
	if (minLambda.y > lb) {
		lbIndex = 1;
		lb = minLambda.y;
	}
	if (minLambda.z > lb) {
		lbIndex = 2;
		lb = minLambda.z;
	}

	float ub = maxLambda.x; //upper bound
	int ubIndex = 0; //Which axis we reflect in if we are inside the cube
	if (maxLambda.y < ub) {
		ubIndex = 1;
		ub = maxLambda.y;
	}
	if (maxLambda.z < ub) {
		ubIndex = 2;
		ub = maxLambda.z;
	}
	//ub = 0;
	if (lb < ub) {
		if (lb > 0.01) { //facing cube
			if (lb < minDist) {
				minDist = lb;
				switch(lbIndex) {
					case 0:
						if (rayDir.x > 0) {
							normal = vec3(-1, 0, 0);
						}
						else {
							normal = vec3(1, 0, 0);
						}
						break;

					case 1:
						if (rayDir.y > 0) {
							normal = vec3(0, -1, 0);
						}
						else {
							normal = vec3(0, 1, 0);
						}
						break;

					case 2:
						if (rayDir.z > 0) {
							normal = vec3(0, 0, -1);
						}
						else {
							normal = vec3(0, 0, 1);
						}
						break;
				}
				reflectivity = newReflectivity;
				color = newColor;
			}
		}
		/*else { //from inside cube
			if (ub > 0.01 && ub < minDist) {
				minDist = ub;
				switch(ubIndex) {
					case 0:
						if (rayDir.x > 0) {
							normal = vec3(1, 0, 0);
						}
						else {
							normal = vec3(-1, 0, 0);
						}
						break;

					case 1:
						if (rayDir.y > 0) {
							normal = vec3(0, 1, 0);
						}
						else {
							normal = vec3(0, -1, 0);
						}
						break;

					case 2:
						if (rayDir.z > 0) {
							normal = vec3(0, 0, 1);
						}
						else {
							normal = vec3(0, 0, -1);
						}
						break;
				}
				reflectivity = newReflectivity;
				color = newColor;
			}
		}*/
	}
}

void rayVsPlane(in vec4 plane, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity);
void rayVsPlane(in vec4 plane, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity) {
	float nq = dot(plane.xyz, rayDir);
	if (nq < 0) { //must point towards plane
		float np = dot(plane.xyz, rayPos);
		float nextDist = (plane.w - np) / nq;
		if (nextDist > 0.0001 && nextDist < minDist) { //TODO - REPLACE 0 WITH MIN DIST TO BE IN VIEWING FRUSTUM (z > d)
			minDist = nextDist;
			normal = normalize(plane.xyz);
			reflectivity = newReflectivity;
			if ((int((rayPos + (rayDir * minDist)).x + playerPos.x + 100) + int((rayPos + (rayDir * minDist)).z + playerPos.z + 100)) % 2 == 0) { //just for chessboard
				color = 0.5 * newColor;
			}
			else {
				color = newColor;
			}
		}
	}
}

void rayVsDisc(in vec4 plane, in vec4 circlePos, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity);
void rayVsDisc(in vec4 plane, in vec4 circlePos, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity) {
	float nq = dot(plane.xyz, rayDir);
	if (nq != 0) { //must point towards plane
		float np = dot(plane.xyz, rayPos);
		float nextDist = (plane.w - np) / nq;
		if (length(circlePos.xyz - (rayPos + rayDir * nextDist)) <= circlePos.w && nextDist > 0.0001 && nextDist < minDist) { //Same as plane however is two sided and has a circle calculation
			minDist = nextDist;
			if (nq > 0) {
				normal = normalize(plane.xyz);
			}
			else {
				normal = -normalize(plane.xyz);
			}
			reflectivity = newReflectivity;
			color = newColor;
			//if ((int((rayPos + (rayDir * minDist)).x + playerPos.x + 100) + int((rayPos + (rayDir * minDist)).z + playerPos.z + 100)) % 2 == 0) { //just for chessboard
			//	color = 0.5 * newColor;
		//	}
		//	else {
		//		color = newColor;
		//	}
		}
	}
}
//min, max, rad
void rayVsCone(in vec2 conePos, in vec3 coneRange, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity);
void rayVsCone(in vec2 conePos, in vec3 coneRange, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity) {
	float k1 = rayPos.x - conePos.x;
	float k2 = rayPos.z - conePos.y;
	float k3 = rayPos.y - coneRange.y;
	float k4 = coneRange.x - coneRange.y;
	float k5 = (coneRange.z * coneRange.z) / (k4 * k4);
	float a = rayDir.x * rayDir.x + rayDir.z * rayDir.z - k5 * rayDir.y * rayDir.y;
	float b = 2 * (k1 * rayDir.x + k2 * rayDir.z - k5 * k3 * rayDir.y);
	float c = k1 * k1 + k2 * k2 - k5 * k3 * k3;
	float discriminant = b * b - 4 * a * c;
	if (discriminant > 0) {
		float nextDist = (-b - sqrt(discriminant)) / (2 * a);
		if (nextDist > 0.0001 && nextDist < minDist) {
			vec3 newPos = rayPos + rayDir * nextDist;
			if (newPos.y >= coneRange.x && newPos.y <= coneRange.y) {
				minDist = nextDist;
				normal = (coneRange.y - coneRange.x) * normalize(vec3(newPos.x - conePos.x, 0, newPos.z - conePos.y));
				normal.y += coneRange.z;
				normal = normalize(normal);
				reflectivity = newReflectivity;
				color = newColor;
			}
		}
	}
}

void rayVsCylinder(in vec2 cylinderPos, in vec3 cylinderRange, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity);
void rayVsCylinder(in vec2 cylinderPos, in vec3 cylinderRange, in vec3 rayPos, in vec3 rayDir, inout float minDist, inout vec3 normal, inout vec3 color, in vec3 newColor, inout float reflectivity, in float newReflectivity) {
	float v1 = rayPos.x - cylinderPos.x;
	float v2 = rayPos.z - cylinderPos.y;
	float p = rayDir.x * v1 + rayDir.z * v2;
	float q = rayDir.x * rayDir.x + rayDir.z * rayDir.z;
	float t = v1 * v1 + v2 * v2 - cylinderRange.z * cylinderRange.z;
	float discriminant = p * p - q * t;
	if (discriminant >= 0) {
		float nextDist = -(p + sqrt(discriminant)) / q;
		if (nextDist > 0.0001 && nextDist < minDist) {
			vec3 newPos = rayPos + rayDir * nextDist;
			if (newPos.y >= cylinderRange.x && newPos.y <= cylinderRange.y) {
				minDist = nextDist;
				normal = normalize(vec3(newPos.x - cylinderPos.x, 0, newPos.z - cylinderPos.y));
				reflectivity = newReflectivity;
				color = newColor;
			}
		}
	}
	rayVsDisc(vec4(0, 1, 0, cylinderRange.x), vec4(cylinderPos.x, cylinderRange.x, cylinderPos.y, cylinderRange.z), rayPos, rayDir, minDist, normal, color, newColor, reflectivity, newReflectivity);
	rayVsDisc(vec4(0, 1, 0, cylinderRange.y), vec4(cylinderPos.x, cylinderRange.y, cylinderPos.y, cylinderRange.z), rayPos, rayDir, minDist, normal, color, newColor, reflectivity, newReflectivity);
}

//assuming that the player's head is at (0, 0)
void main() {
	mat3x3 rotation = mat3x3(1, 0, 0, 0, cos(playerRot.x), sin(playerRot.x), 0, -sin(playerRot.x), cos(playerRot.x)) * mat3x3(cos(playerRot.y), 0, -sin(playerRot.y), 0, 1, 0, sin(playerRot.y), 0, cos(playerRot.y));
	vec3 rayPos = vec3(0, 0, 0); //This may be needed for reflections and stuff, but not right now
	vec3 rayDir = normalize(vec3(aspectRatio * pos.x, pos.y, d)) * rotation;
	vec3 normal;

	//TODO - ALLOW FOR ANY NUMBER OF SHAPES AND REFLECTIONS
	vec4 sphere1 = vec4(0, 0, 5, 1) - vec4(playerPos.xyz, 0); //x, y, z, radius
	vec4 sphere2 = vec4(3, 0, 5, 1) - vec4(playerPos.xyz, 0);
	vec4 sphere3 = vec4(-3, 0, 5, 1) - vec4(playerPos.xyz, 0);
	//vec4 playerSphere = vec4(0, 0, 0, 0.5);
	vec3 boxMin1 = vec3(-5, -1.5, -1) - playerPos;
	vec3 boxMax1 = vec3(-4, 1, 1) - playerPos;
	vec3 boxMin2 = vec3(4, -1.5, -1) - playerPos;
	vec3 boxMax2 = vec3(5, 1, 1) - playerPos;
	vec4 plane = vec4(0, 1, 0, -1.5); //x, y, z, d -> y = -1
	plane.w -= dot(plane.xyz, playerPos); //translate plane by player's position
	vec4 circlePlane = vec4(2, -1, 0, 7);
	vec4 circleCenter = vec4(vec3(4, 1, 0) - playerPos.xyz, 1);
	circlePlane.w -= dot(circlePlane.xyz, playerPos);
	vec2 cylinderPos = vec2(-2.5, -1.5) - playerPos.xz;
	vec3 cylinderRange = vec3(-1.5, 0, 0.5) - vec3(playerPos.yy, 0);
	vec2 conePos = vec2(3.5, 2.5) - playerPos.xz;
	vec3 coneRange = vec3(-1.5, 0, 0.5) - vec3(playerPos.yy, 0);

	float lightStrength = 50;
	vec3 lightPos = (vec3(0, 10, 0) - playerPos); //- vec4(playerPos.xyz, 0)
	vec3 lightDir = normalize(vec3(-1, -1, 1));
	vec3 currLightDir;
	vec3 dummy = vec3(0, 0, 0);
	float distFromLight;
	float minLightDist;


	float reflectivity = 1;
	float currReflectivity = 0;
	for (int i = 0; i < 12; i++) {
		float brightness = 0;
		vec3 color = vec3(0, 0, 0);
		//1st ray
		float minDist = 1000000;
		rayVsSphere(sphere1, rayPos, rayDir, minDist, normal, color, vec3(1, 0, 0), currReflectivity, 0.5); //TO ADD MORE SHAPES ADD HERE AND IN SHADOW SECTION
		rayVsSphere(sphere2, rayPos, rayDir, minDist, normal, color, vec3(0, 1, 0), currReflectivity, 0.1);
		rayVsSphere(sphere3, rayPos, rayDir, minDist, normal, color, vec3(0, 0, 1), currReflectivity, 0.9);
		//rayVsSphere(playerSphere, rayPos, rayDir, minDist, normal, color, vec3(1, 1, 1), currReflectivity, 0);
		rayVsBox(boxMin1, boxMax1, rayPos, rayDir, minDist, normal, color, vec3(1, 0, 1), currReflectivity, 1);
		rayVsBox(boxMin2, boxMax2, rayPos, rayDir, minDist, normal, color, vec3(1, 0, 1), currReflectivity, 1);
		rayVsPlane(plane, rayPos, rayDir, minDist, normal, color, vec3(1, 1, 1), currReflectivity, 0.3);
		rayVsDisc(circlePlane, circleCenter, rayPos, rayDir, minDist, normal, color, vec3(1, 1, 1), currReflectivity, 1);
		rayVsCylinder(cylinderPos, cylinderRange, rayPos, rayDir, minDist, normal, color, vec3(0, 1, 1), currReflectivity, 0.6);
		rayVsCylinder(cylinderPos + vec2(0, 3), cylinderRange, rayPos, rayDir, minDist, normal, color, vec3(0, 1, 1), currReflectivity, 0.6);
		rayVsCone(conePos, coneRange, rayPos, rayDir, minDist, normal, color, vec3(1, 1, 0), currReflectivity, 0.5);
		rayVsCone(conePos - vec2(0, 5), coneRange + vec3(0, 1, 0), rayPos, rayDir, minDist, normal, color, vec3(1, 1, 0), currReflectivity, 0.5);

		if (i != 0) { //stuff that should only be seen in reflections i.e. player in first person mode
			rayVsSphere(vec4(0, 0, 0, 0.5), rayPos, rayDir, minDist, normal, color, vec3(1, 1, 1), currReflectivity, 0);
			rayVsSphere(vec4(0, -1, 0, 0.5), rayPos, rayDir, minDist, normal, color, vec3(1, 1, 1), currReflectivity, 0);
			rayVsCylinder(vec2(0, 0), vec3(-1, 0, 0.5), rayPos, rayDir, minDist, normal, color, vec3(1, 1, 1), currReflectivity, 0);
		}

		//determine next ray
		if (minDist != 1000000) {
			rayPos += minDist * rayDir;
			reflectRay(rayDir, normal);


			//Determine if light can reach point
			currLightDir = rayPos - lightPos;
			distFromLight = length(currLightDir);
			minLightDist = distFromLight;
			currLightDir /= distFromLight;
			rayVsSphere(sphere1, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity); //we don't want a new normal / colour in this case
			rayVsSphere(sphere2, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsSphere(sphere3, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			//rayVsSphere(playerSphere, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsBox(boxMin1, boxMax1, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsBox(boxMin2, boxMax2, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsPlane(plane, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsDisc(circlePlane, circleCenter, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsCylinder(cylinderPos, cylinderRange, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsCylinder(cylinderPos + vec2(0, 3), cylinderRange, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsCone(conePos, coneRange, lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsCone(conePos - vec2(0, 5), coneRange + vec3(0, 1, 0), lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);

			rayVsSphere(vec4(0, 0, 0, 0.5), lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsSphere(vec4(0, -1, 0, 0.5), lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);
			rayVsCylinder(vec2(0, 0), vec3(-1, 0, 0.5), lightPos, currLightDir, minLightDist, dummy, dummy, dummy, currReflectivity, currReflectivity);


			//light strength = k / d^2 where k is the strength of the light 1 unit away
			//determine brightness at point
			if (minLightDist > distFromLight - 0.01) {
				FragColor += reflectivity * max(0.05, -dot(normal, lightDir) * lightStrength / (distFromLight * distFromLight)) * vec4(color, 1);
			}
			else {
				FragColor += reflectivity * 0.05 * vec4(color, 1);
			}
			reflectivity *= currReflectivity;
		}
		else {
			break;
		}
	}
}