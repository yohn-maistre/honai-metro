<!-- Decorative linework only: it does not infer a person's place or identity. -->
<svg class="profile-linework" viewBox="0 0 960 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <g fill="none" stroke="currentColor" stroke-width=".8">
    {#each Array.from({ length: 15 }, (_, i) => i) as i}
      <path d={'M -60 ' + (24 + i * 13) + ' C 150 ' + (-110 + i * 13) + ', 280 ' + (260 + i * 8) + ', 520 ' + (100 + i * 8) + ' S 820 ' + (-30 + i * 11) + ', 1030 ' + (32 + i * 13)}/>
    {/each}
  </g>
</svg>
