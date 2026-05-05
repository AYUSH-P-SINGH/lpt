cmake_minimum_required(VERSION 3.16)
project(lpt CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(PkgConfig REQUIRED)
pkg_check_modules(RTLSDR REQUIRED librtlsdr)
pkg_check_modules(SDL2 REQUIRED sdl2)

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
)

target_compile_options(lpt PRIVATE -Wall -Wextra -O2)

# ── Tests ──────────────────────────────────────
enable_testing()

foreach(test test_crc test_cpr test_demod)
    add_executable(${test} tests/${test}.cpp src/decoder/crc.cpp
                                             src/decoder/cpr.cpp
                                             src/dsp/demod.cpp)
    target_include_directories(${test} PRIVATE src)
    add_test(NAME ${test} COMMAND ${test})
endforeach()
