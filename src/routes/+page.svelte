<script>
    import CounterDisplay from "./CounterDisplay.svelte";
    let counter = $state({
        count: 0,
    }); 
</script>

<CounterDisplay bind:counter></CounterDisplay>
