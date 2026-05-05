#include "ring_buffer.h"
#include <cstring>
#include <atomic>

void rb_init(RingBuffer* rb)
{
    rb->head = 0;
    rb->tail = 0;
}

bool rb_push(RingBuffer* rb, const uint8_t* src, uint32_t len)
{
    uint32_t avail = RING_BUFFER_SIZE - (rb->head - rb->tail);
    if (len > avail) return false;  // drop if full
    for (uint32_t i = 0; i < len; i++)
        rb->data[(rb->head + i) & (RING_BUFFER_SIZE - 1)] = src[i];
    std::atomic_thread_fence(std::memory_order_release);
    rb->head += len;
    return true;
}

uint32_t rb_pop(RingBuffer* rb, uint8_t* dst, uint32_t max_len)
{
    std::atomic_thread_fence(std::memory_order_acquire);
    uint32_t avail = rb->head - rb->tail;
    uint32_t len = avail < max_len ? avail : max_len;
    for (uint32_t i = 0; i < len; i++)
        dst[i] = rb->data[(rb->tail + i) & (RING_BUFFER_SIZE - 1)];
    rb->tail += len;
    return len;
}

uint32_t rb_available(const RingBuffer* rb)
{
    return rb->head - rb->tail;
}
