cmake_minimum_required(VERSION 3.16)
project(lpt CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(PkgConfig REQUIRED)
pkg_check_modules(RTLSDR librtlsdr)
pkg_check_modules(SDL2 sdl2)

if(RTLSDR_FOUND AND SDL2_FOUND)
    file(GLOB_RECURSE SOURCES src/*.cpp)

    add_executable(lpt ${SOURCES})

    target_include_directories(lpt PRIVATE
        src
        ${RTLSDR_INCLUDE_DIRS}
        ${SDL2_INCLUDE_DIRS}
    )

    target_link_libraries(lpt PRIVATE
        ${RTLSDR_LIBRARIES}
        ${SDL2_LIBRARIES}
        ${CMAKE_DL_LIBS}
    )

    target_compile_options(lpt PRIVATE -Wall -Wextra -O2)
else()
    message(STATUS "librtlsdr or SDL2 not found — skipping main lpt target")
endif()

# ── Tests ──────────────────────────────────────
enable_testing()

add_executable(test_callsign tests/test_callsign.cpp src/decoder/callsign.cpp)
target_include_directories(test_callsign PRIVATE src)
target_compile_options(test_callsign PRIVATE -Wall -Wextra -O2)
add_test(NAME test_callsign COMMAND test_callsign)

foreach(test test_crc test_cpr test_demod)
    add_executable(${test} tests/${test}.cpp src/decoder/crc.cpp
                                             src/decoder/cpr.cpp
                                             src/dsp/demod.cpp)
    target_include_directories(${test} PRIVATE src)
    target_compile_options(${test} PRIVATE -Wall -Wextra -O2)
    add_test(NAME ${test} COMMAND ${test})
endforeach()

add_executable(test_tracker tests/test_tracker.cpp src/tracker/aircraft_table.cpp)
target_include_directories(test_tracker PRIVATE src)
target_compile_options(test_tracker PRIVATE -Wall -Wextra -O2)
add_test(NAME test_tracker COMMAND test_tracker)

add_executable(test_velocity tests/test_velocity.cpp src/decoder/velocity.cpp)
target_include_directories(test_velocity PRIVATE src)
target_compile_options(test_velocity PRIVATE -Wall -Wextra -O2)
add_test(NAME test_velocity COMMAND test_velocity)
