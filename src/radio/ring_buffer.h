#pragma once
#include <cstdint>
#include <cstddef>

// Lock-free single-producer single-consumer ring buffer for IQ bytes
// Sized as a power of two for efficient masking

#define RING_BUFFER_SIZE (1 << 22)  // 4MB — tune to taste

struct RingBuffer {
    uint8_t  data[RING_BUFFER_SIZE];
    uint32_t head;  // written by producer
    uint32_t tail;  // read by consumer
};

void     rb_init(RingBuffer* rb);
bool     rb_push(RingBuffer* rb, const uint8_t* src, uint32_t len);
uint32_t rb_pop(RingBuffer* rb, uint8_t* dst, uint32_t max_len);
uint32_t rb_available(const RingBuffer* rb);
